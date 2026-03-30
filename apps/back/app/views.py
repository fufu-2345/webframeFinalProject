from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.contrib.auth import login
from django.core.files.storage import default_storage
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction
from collections import defaultdict

from django.db.models import Count, ExpressionWrapper, F, IntegerField, Sum

from .createTemp import CreateTempSerializer, EbookSerializer, PaymentSerializer, TransAccountSerializer
from .models import SystemUser, Payment, TransAccount, TopupPlan, eBook


def get_request_user(request):
    if hasattr(request, 'user') and request.user.is_authenticated:
        return request.user

    userid = request.COOKIES.get('userid')
    if userid:
        return get_object_or_404(SystemUser, userid=userid)

    return None


@api_view(['POST'])
@permission_classes([AllowAny])
def create_mock_user(request):
    serializer = CreateTempSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'สร้าง User สำเร็จ!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def create_mock_ebook(request):
    serializer = EbookSerializer(data=request.data)

    if serializer.is_valid():
        ebook = serializer.save(cover='', ebooksample='')

        file_obj = request.FILES.get('cover') or request.FILES.get('ebooksample')

        if file_obj:
            save_path = f"eBookPic/{file_obj.name}"
            saved_path = default_storage.save(save_path, file_obj)

            ebook.cover.name = saved_path
            ebook.ebooksample.name = saved_path
            ebook.save()

        return Response({'message': 'สร้าง eBook สำเร็จ!'}, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_mock_users(request):
    users = SystemUser.objects.all().values('userid', 'fullname', 'role')
    return Response(list(users), status=status.HTTP_200_OK)


@api_view(['GET'])
def current_user_profile(request):
    userid = request.COOKIES.get('userid')
    user = get_object_or_404(SystemUser, userid=userid)

    return Response({
        'userid': user.userid,
        'fullname': user.fullname,
        'role': user.role,
        'token_balance': user.token_balance,
        'is_author_active': user.is_author_active(),
        'author_expire_at': user.author_expire_at,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def my_payment_requests(request):
    userid = request.COOKIES.get('userid')
    user = get_object_or_404(SystemUser, userid=userid)

    data = (
        Payment.objects
        .filter(user=user)
        .values(
            'id',
            'user_id',
            'paymenttype',
            'subprice',
            'tokenpaid',
            'transdate',
            'enddate',
            'status',
        )
        .order_by('-transdate')
    )

    return Response(list(data), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    userid = request.data.get('userid')
    try:
        user = SystemUser.objects.get(userid=userid)

        login(request, user)

        if user.role == 'author' and not user.is_author_active():
            user.role = 'user'
            user.save()

        response = Response({
            'message': 'Login success',
            'userid': user.userid,
            'fullname': user.fullname,
            'role': user.role,
        }, status=status.HTTP_200_OK)

        response.set_cookie('userid', str(user.userid), max_age=604800, samesite='Lax')
        response.set_cookie('role', user.role, max_age=604800, samesite='Lax')

        return response
    except SystemUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_ebooks(request):
    ebooks = eBook.objects.all()
    serializer = EbookSerializer(ebooks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    return Response({'csrfToken': get_token(request)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def topup_plan_list(request):
    plans = TopupPlan.objects.filter(is_active=True).values(
        'id',
        'name',
        'price',
        'token',
        'is_active',
    ).order_by('price', 'id')

    return Response(list(plans), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_topup_plans(request):
    plans = TopupPlan.objects.filter(is_active=True).values()
    return Response({'data': list(plans)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def topSellingBook(request):
    data = (
        TransAccount.objects
        .filter(paidtype='buy', ebook__isnull=False)
        .values(
            ebookid=F('ebook__ebookid'),
            title=F('ebook__title'),
            author=F('ebook__author__fullname'),
        )
        .annotate(total_sales=Count('id'))
        .order_by('-total_sales')
    )

    return Response(list(data), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def topBookByAuthor(request):
    userid = request.COOKIES.get('userid')

    if not userid:
        return Response({'error': 'login please'}, status=status.HTTP_401_UNAUTHORIZED)

    user = get_object_or_404(SystemUser, userid=userid)

    if user.role != 'author':
        return Response({'error': 'Author only'}, status=status.HTTP_403_FORBIDDEN)

    data = (
        TransAccount.objects
        .filter(paidtype='buy', ebook__author=user)
        .values(
            ebookid=F('ebook__ebookid'),
            title=F('ebook__title'),
        )
        .annotate(total_sales=Count('id'))
        .order_by('-total_sales')
    )

    return Response(list(data), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def transactionList(request):
    userid = request.COOKIES.get('userid')

    if not userid:
        return Response({'error': 'login please'}, status=status.HTTP_401_UNAUTHORIZED)

    user = get_object_or_404(SystemUser, userid=userid)

    if user.role != 'author':
        return Response({'error': 'Author only'}, status=status.HTTP_403_FORBIDDEN)

    data = (
        TransAccount.objects
        .filter(paidtype='sell', owner=user)
        .annotate(
            earnings=ExpressionWrapper(F('gettoken') * 50, output_field=IntegerField())
        )
        .values(
            transaction_id=F('id'),
            ebook_title=F('ebook__title'),
            tokens_earned=F('gettoken'),
            earnings=F('earnings'),
        )
        .order_by('-id')
    )

    return Response(list(data), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subscription_info(request):
    return Response({'price': 1999, 'duration': '1 year'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_subscription(request):
    user = get_request_user(request)
    if not user:
        return Response({'error': 'Please login first'}, status=status.HTTP_401_UNAUTHORIZED)

    Payment.objects.create(user=user, paymenttype='subscription', subprice=1999)

    return Response({'message': 'สมัครสำเร็จ รอ admin ตรวจสอบ'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_topup(request):
    user = get_request_user(request)
    if not user:
        return Response({'error': 'Please login first'}, status=status.HTTP_401_UNAUTHORIZED)

    plan_id = request.data.get('plan_id')
    token_amount = request.data.get('token_amount')

    if token_amount is not None:
        try:
            token_amount = int(token_amount)
        except (TypeError, ValueError):
            return Response({'error': 'token amount invalid'}, status=status.HTTP_400_BAD_REQUEST)

        if token_amount <= 0:
            return Response({'error': 'token amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        subprice = token_amount * 50
        tokenpaid = token_amount
    else:
        plan = get_object_or_404(TopupPlan, id=plan_id)
        if not plan.is_active:
            return Response({'error': 'plan ใช้งานไม่ได้'}, status=status.HTTP_400_BAD_REQUEST)

        subprice = plan.price
        tokenpaid = plan.token

    Payment.objects.create(
        user=user,
        paymenttype='topup',
        subprice=subprice,
        tokenpaid=tokenpaid,
    )

    return Response({'message': 'เติมเงินสำเร็จ รอ admin ตรวจสอบ'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_ebook(request):
    user = get_request_user(request)
    if not user:
        return Response({'error': 'Please login first'}, status=status.HTTP_401_UNAUTHORIZED)

    ebook_id = request.data.get('ebook_id')
    ebook = get_object_or_404(eBook, ebookid=ebook_id)

    if ebook.purchased_users.filter(userid=user.userid).exists():
        return Response({'error': 'ซื้อแล้ว'}, status=status.HTTP_400_BAD_REQUEST)

    if user.token_balance < ebook.ebooktoken:
        return Response({'error': 'token ไม่พอ'}, status=status.HTTP_400_BAD_REQUEST)

    user.token_balance -= ebook.ebooktoken
    user.save()

    ebook.purchased_users.add(user)

    TransAccount.objects.create(
        owner=user,
        paidtype='buy',
        paidtoken=ebook.ebooktoken,
        tokenbalance=user.token_balance,
        ebook=ebook,
    )

    author = ebook.author
    author.token_balance += ebook.ebooktoken
    author.save()

    TransAccount.objects.create(
        owner=author,
        paidtype='sell',
        gettoken=ebook.ebooktoken,
        tokenbalance=author.token_balance,
        ebook=ebook,
    )

    return Response({'message': 'ซื้อสำเร็จ'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def author_status(request):
    userid = request.COOKIES.get('userid')
    user = get_object_or_404(SystemUser, userid=userid)

    return Response({
        'role': user.role,
        'is_active': user.is_author_active(),
        'expire_at': user.author_expire_at,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_pending_payments(request):
    payments = Payment.objects.filter(status='wait').values()
    return Response(list(payments), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def verify_payment(request):
    payment_id = request.data.get('payment_id')
    action = request.data.get('action')

    payment = get_object_or_404(Payment, id=payment_id)
    user = payment.user

    if payment.status != 'wait':
        return Response({'error': 'already processed'}, status=status.HTTP_400_BAD_REQUEST)

    if action == 'reject':
        payment.status = 'rejected'
        payment.save()
        return Response({'message': 'rejected'}, status=status.HTTP_200_OK)

    if action not in ['approve', 'confirm']:
        return Response({'error': 'invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        if payment.paymenttype == 'subscription':
            user.extend_author()
        elif payment.paymenttype == 'topup':
            user.token_balance += payment.tokenpaid
            user.save()
            TransAccount.objects.create(
                owner=user,
                paidtype='topup',
                gettoken=payment.tokenpaid,
                tokenbalance=user.token_balance,
            )

        payment.status = 'received'
        payment.save()

    return Response({'message': 'confirmed'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_topup_list(request):
    data = Payment.objects.filter(paymenttype='topup').values()
    return Response(list(data), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_subscription_list(request):
    data = Payment.objects.filter(paymenttype='subscription').values()
    return Response(list(data), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_history(request):
    userid = request.COOKIES.get('userid') or request.GET.get('userid')
    if not userid:
        return Response({'error': 'Please login first'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = SystemUser.objects.get(userid=userid)
    except SystemUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    payments = Payment.objects.filter(user=user).order_by('id')
    payment_list = []
    for p in payments:
        payment_list.append({
            'id': p.id,
            'type': p.get_paymenttype_display(),
            'tokenpaid': p.tokenpaid,
            'status': p.get_status_display(),
        })

    transactions = TransAccount.objects.filter(owner=user).order_by('id')
    transaction_list = []
    current_balance = 0
    for t in transactions:
        current_balance = current_balance + t.gettoken - t.paidtoken
        transaction_list.append({
            'id': t.id,
            'paidtype': t.get_paidtype_display(),
            'ebook_title': t.ebook.title if t.ebook else '-',
            'paidtoken': t.paidtoken,
            'gettoken': t.gettoken,
            'tokenbalance': current_balance,
            'balance': current_balance * 50,
            'created_at': t.created_at.strftime('%d/%m/%Y'),
        })

    return Response({
        'message': 'success',
        'payments': payment_list,
        'transactions': transaction_list,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_payment(request):
    username = request.GET.get('username')
    date = request.GET.get('date')

    queryset = Payment.objects.all()

    if username:
        queryset = queryset.filter(user__username__icontains=username)

    if date:
        queryset = queryset.filter(transdate__date=date)

    serializer = PaymentSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_transaccount(request):
    username = request.GET.get('username')
    date = request.GET.get('date')

    queryset = TransAccount.objects.all().order_by('created_at')
    if username:
        queryset = queryset.filter(owner__username__icontains=username)

    if date:
        queryset = queryset.filter(created_at__date=date)

    serializer = TransAccountSerializer(queryset, many=True)

    balances = defaultdict(int)
    data = []

    for item in serializer.data:
        user = item.get('owner')
        balances[user] += item.get('gettoken', 0) - item.get('paidtoken', 0)
        item['tokenbalance'] = balances[user]
        data.append(item)

    return Response(data)


def get_current_token_balance(user):
    latest_trans = TransAccount.objects.filter(owner=user).order_by('-id').first()
    return latest_trans.tokenbalance if latest_trans else 0


@api_view(['GET'])
@permission_classes([AllowAny])
def get_author_earnings(request):
    user_id = request.GET.get('user_id')

    if user_id:
        try:
            user = SystemUser.objects.get(userid=user_id)
        except SystemUser.DoesNotExist:
            return Response({'error': f'ไม่พบผู้ใช้ ID {user_id}'}, status=status.HTTP_404_NOT_FOUND)
    else:
        user = SystemUser.objects.filter(role='author').first()
        if not user:
            return Response({'error': 'ไม่พบนักเขียนในระบบ'}, status=status.HTTP_404_NOT_FOUND)

    if user.role != 'author':
        return Response({'error': f'ผู้ใช้ {user.fullname} ไม่ใช่นักเขียน'}, status=status.HTTP_403_FORBIDDEN)

    author_info = {
        'userid': user.userid,
        'fullname': user.fullname,
        'username': user.username,
        'email': user.email,
        'role': user.role,
    }

    current_token_balance = get_current_token_balance(user)
    current_balance_baht = current_token_balance * 50

    total_tokens_earned = TransAccount.objects.filter(owner=user, paidtype='sell').aggregate(total=Sum('gettoken'))['total'] or 0
    total_baht_earned = total_tokens_earned * 50

    author_ebooks = eBook.objects.filter(author=user)

    books_data = []
    for ebook in author_ebooks:
        sales_count = TransAccount.objects.filter(paidtype='sell', ebook=ebook).count()
        total_tokens = TransAccount.objects.filter(paidtype='sell', ebook=ebook).aggregate(total=Sum('gettoken'))['total'] or 0

        books_data.append({
            'ebookid': ebook.ebookid,
            'category': ebook.get_category_display(),
            'title': ebook.title,
            'cover': ebook.cover.url if ebook.cover else None,
            'token_per_book': ebook.ebooktoken,
            'price_baht': ebook.ebooktoken * 50,
            'sold_count': sales_count,
            'total_tokens_earned': total_tokens,
            'total_baht_earned': total_tokens * 50,
        })

    books_data.sort(key=lambda x: x['sold_count'], reverse=True)
    top_10_books = books_data[:10]

    return Response({
        'author': author_info,
        'summary': {
            'current_token_balance': current_token_balance,
            'current_balance_baht': current_balance_baht,
            'total_tokens_earned': total_tokens_earned,
            'total_baht_earned': total_baht_earned,
            'total_books': author_ebooks.count(),
            'total_sales': sum(book['sold_count'] for book in books_data),
        },
        'top_selling_books': top_10_books,
        'all_books': books_data,
    }, status=status.HTTP_200_OK)
