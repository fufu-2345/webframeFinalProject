from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from django.db.models import Count, ExpressionWrapper, F, IntegerField

from .createTemp import CreateTempSerializer, EbookSerializer
from .models import TransAccount, SystemUser, Payment, TopupPlan, eBook

@api_view(['POST'])
@permission_classes([AllowAny])
def create_mock_user(request):
    serializer = CreateTempSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'สร้าง User สำเร็จ!'}, status=201)
    return Response(serializer.errors, status=400)


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

        return Response({'message': 'สร้าง eBook สำเร็จ!'}, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_mock_users(request):
    users = SystemUser.objects.all().values('userid', 'fullname', 'role')
    return Response(list(users), status=200)


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
    }, status=200)


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

    return Response(list(plans), status=200)


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

    return Response(list(data), status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token(request):
    return Response({'csrfToken': get_token(request)}, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    userid = request.data.get('userid')
    try:
        user = SystemUser.objects.get(userid=userid)

        response = Response({
            'message': 'Login success',
            'userid': user.userid,
            'fullname': user.fullname,
            'role': user.role
        }, status=200)

        response.set_cookie('userid', str(user.userid), max_age=604800, samesite='Lax')
        response.set_cookie('role', user.role, max_age=604800, samesite='Lax')

        return response
    except SystemUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)


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

    return Response(list(data), status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def topBookByAuthor(request):
    userid = request.COOKIES.get('userid')

    if not userid:
        return Response({'error': 'login please'}, status=401)

    user = get_object_or_404(SystemUser, userid=userid)

    if user.role != 'author':
        return Response({'error': 'Author only'}, status=403)

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

    return Response(list(data), status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def transactionList(request):
    userid = request.COOKIES.get('userid')

    if not userid:
        return Response({'error': 'login please'}, status=401)

    user = get_object_or_404(SystemUser, userid=userid)

    if user.role != 'author':
        return Response({'error': 'Author only'}, status=403)

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

    return Response(list(data), status=200)

@api_view(['POST'])
def request_topup(request):
    userid = request.COOKIES.get('userid')
    user = get_object_or_404(SystemUser, userid=userid)

    token_amount = request.data.get('token_amount')

    if token_amount is not None:
        try:
            token_amount = int(token_amount)
        except (TypeError, ValueError):
            return Response({'error': 'token amount invalid'}, status=400)

        if token_amount <= 0:
            return Response({'error': 'token amount must be greater than 0'}, status=400)

        subprice = token_amount * 50
        tokenpaid = token_amount
    else:
        plan_id = request.data.get('plan_id')
        plan = get_object_or_404(TopupPlan, id=plan_id)
        subprice = plan.price
        tokenpaid = plan.token

    Payment.objects.create(
        user=user,
        paymenttype='topup',
        subprice=subprice,
        tokenpaid=tokenpaid
    )

    return Response({'message': 'รอ admin ตรวจสอบ'}, status=200)

@api_view(['POST'])
def request_subscription(request):
    userid = request.COOKIES.get('userid')
    user = get_object_or_404(SystemUser, userid=userid)

    Payment.objects.create(
        user=user,
        paymenttype='subscription',
        subprice=1999
    )

    return Response({'message': 'สมัครสำเร็จ รอ admin'}, status=200)


@api_view(['GET'])
def author_status(request):
    userid = request.COOKIES.get('userid')
    user = get_object_or_404(SystemUser, userid=userid)

    return Response({
        'role': user.role,
        'is_active': user.is_author_active(),
        'expire_at': user.author_expire_at
    })

@api_view(['GET'])
def list_pending_payments(request):
    role = request.COOKIES.get('role')
    if role != 'admin':
        return Response({'error': 'admin only'}, status=403)

    data = Payment.objects.filter(status='wait').values()
    return Response(list(data))


@api_view(['POST'])
def verify_payment(request):
    role = request.COOKIES.get('role')
    if role != 'admin':
        return Response({'error': 'admin only'}, status=403)

    payment_id = request.data.get('payment_id')
    action = request.data.get('action')

    payment = get_object_or_404(Payment, id=payment_id)
    user = payment.user

    if payment.status != 'wait':
        return Response({'error': 'already processed'}, status=400)

    if action == 'reject':
        payment.status = 'rejected'
        payment.save()
        return Response({'message': 'rejected'})

    if action not in ['approve', 'confirm']:
        return Response({'error': 'invalid action'}, status=400)

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
                tokenbalance=user.token_balance
            )

        payment.status = 'received'
        payment.save()

    return Response({'message': 'confirmed'})


@api_view(['GET'])
def admin_topup_list(request):
    role = request.COOKIES.get('role')
    if role != 'admin':
        return Response({'error': 'admin only'}, status=403)

    data = Payment.objects.filter(paymenttype='topup').values()
    return Response(list(data))


@api_view(['GET'])
def admin_subscription_list(request):
    role = request.COOKIES.get('role')
    if role != 'admin':
        return Response({'error': 'admin only'}, status=403)

    data = Payment.objects.filter(paymenttype='subscription').values()
    return Response(list(data))
