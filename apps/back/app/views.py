from django.contrib.auth import login
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.middleware.csrf import get_token
from django.http import JsonResponse

from .createTemp import CreateTempSerializer, EbookSerializer
from .models import SystemUser, Payment, TransAccount, eBook, TopupPlan

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
<<<<<<< HEAD
from .createTemp import CreateTempSerializer, EbookSerializer
from app.models import SystemUser, eBook
=======
from .createTemp import CreateTempSerializer, EbookSerializer , PaymentSerializer , TransAccountSerializer
from app.models import SystemUser,Payment,TransAccount ,eBook
>>>>>>> search-history-earn
from django.core.files.storage import default_storage
from collections import defaultdict
from django.db.models import Sum



@api_view(["POST"])
@permission_classes([AllowAny])
def create_mock_user(request):
    serializer = CreateTempSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "สร้าง User สำเร็จ!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_user_balance(request, userid):
    try:
        user = SystemUser.objects.get(userid=userid)
        return JsonResponse({"token_balance": user.token_balance})
    except SystemUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def create_mock_ebook(request):
    serializer = EbookSerializer(data=request.data)

    if serializer.is_valid():
        ebook = serializer.save(cover="", ebooksample="")

        file_obj = request.FILES.get("cover") or request.FILES.get("ebooksample")

        if file_obj:
            save_path = f"eBookPic/{file_obj.name}"
            saved_path = default_storage.save(save_path, file_obj)

            ebook.cover.name = saved_path
            ebook.ebooksample.name = saved_path
            ebook.save()

        return Response(
            {"message": "สร้าง eBook สำเร็จ!"}, status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_mock_users(request):
    users = SystemUser.objects.all().values("userid", "fullname", "role")
    return Response(list(users), status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    userid = request.data.get("userid")
    try:
        user = SystemUser.objects.get(userid=userid)
        
        login(request, user)

        if user.role == "author" and not user.is_author_active():
            user.role = "user"
            user.save()

        response = Response(
            {
                "message": "Login success",
                "userid": user.userid,
                "fullname": user.fullname,
                "role": user.role,
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie("userid", str(user.userid), max_age=604800, samesite="Lax")
        response.set_cookie("role", user.role, max_age=604800, samesite="Lax")

        return response
    except SystemUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def list_ebooks(request):
    ebooks = eBook.objects.all()
    serializer = EbookSerializer(ebooks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_csrf_token(request):
    return Response({"csrfToken": get_token(request)})

# payment
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_subscription_info(request):
    return Response({"price": 1999, "duration": "1 year"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_subscription(request):
    user = request.user

    Payment.objects.create(user=user, paymenttype="subscription", subprice=1999)

    return Response(
        {"message": "สมัครสำเร็จ รอ admin ตรวจสอบ"}, status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_topup_plans(request):
    plans = TopupPlan.objects.filter(is_active=True).values()
    return Response({"data": list(plans)}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_topup(request):
    user = request.user

    plan_id = request.data.get("plan_id")
    plan = get_object_or_404(TopupPlan, id=plan_id)

    if not plan.is_active:
        return Response({"error": "plan ใช้งานไม่ได้"}, status=status.HTTP_400_BAD_REQUEST)

    Payment.objects.create(
        user=user,
        paymenttype="topup",
        subprice=plan.price,
        tokenpaid=plan.token,
    )

    return Response(
        {"message": "เติมเงินสำเร็จ รอ admin ตรวจสอบ"}, status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_ebook(request):
    user = request.user

    ebook_id = request.data.get("ebook_id")
    ebook = get_object_or_404(eBook, ebookid=ebook_id)

    if ebook.purchased_users.filter(userid=user.userid).exists():
        return Response({"error": "ซื้อแล้ว"}, status=status.HTTP_400_BAD_REQUEST)

    if user.token_balance < ebook.ebooktoken:
        return Response({"error": "token ไม่พอ"}, status=status.HTTP_400_BAD_REQUEST)

    user.token_balance -= ebook.ebooktoken
    user.save()

    ebook.purchased_users.add(user)

    TransAccount.objects.create(
        owner=user,
        paidtype="buy",
        paidtoken=ebook.ebooktoken,
        tokenbalance=user.token_balance,
        ebook=ebook,
    )

    author = ebook.author

    author.token_balance += ebook.ebooktoken
    author.save()

    TransAccount.objects.create(
        owner=author,
        paidtype="sell",
        gettoken=ebook.ebooktoken,
        tokenbalance=author.token_balance,
        ebook=ebook,
    )

    return Response({"message": "ซื้อสำเร็จ"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_pending_payments(request):
    payments = Payment.objects.filter(status="wait").values()
    return Response(list(payments), status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def verify_payment(request):
    payment_id = request.data.get("payment_id")
    action = request.data.get("action")

    payment = get_object_or_404(Payment, id=payment_id)
    user = payment.user

    if payment.status != "wait":
        return Response(
            {"error": "transaction นี้ถูกจัดการแล้ว"}, status=status.HTTP_400_BAD_REQUEST
        )

    if action == "reject":
        payment.status = "rejected"
        payment.save()
        return Response({"message": "rejected"}, status=status.HTTP_200_OK)

    if payment.paymenttype == "subscription":
        user.extend_author()

    elif payment.paymenttype == "topup":
        user.token_balance += payment.tokenpaid
        user.save()

    TransAccount.objects.create(
        owner=user,
        paidtype=payment.paymenttype,
        gettoken=payment.tokenpaid,
        tokenbalance=user.token_balance,
    )

    payment.status = "received"
    payment.save()

    return Response({"message": "confirmed"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def payment_history(request):
    userid = request.COOKIES.get('userid') or request.GET.get('userid')
    if not userid:
        return Response({'error': 'Please login first'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        user = SystemUser.objects.get(userid=userid)
    except SystemUser.DoesNotExist:
        return Response({'User not found'})
    

    payments = Payment.objects.filter(user=user).order_by('id')
    payment_list = []
    for p in payments:
        payment_list.append({
            'id' : p.id,
            'type' : p.get_paymenttype_display(),
            'tokenpaid':p.tokenpaid,
            'status':p.get_status_display(),
        })

    transactions = TransAccount.objects.filter(owner=user).order_by('id')
    transaction_list = []
    current_balance = 0
    for t in transactions:
        current_balance = current_balance + t.gettoken - t.paidtoken
        transaction_list.append({
            'id': t.id,
            'paidtype' : t.get_paidtype_display(),
            'ebook_title': t.ebook.title if t.ebook else '-',
            'paidtoken': t.paidtoken,
            'gettoken': t.gettoken,
            'tokenbalance':current_balance,
            'balance' : current_balance * 50,
            'created_at': t.created_at.strftime("%d/%m/%Y")
            })
    return Response({
        'message': 'success',
        'payments': payment_list,
        'transactions': transaction_list
    }, status = status.HTTP_200_OK)




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


from collections import defaultdict

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
@permission_classes([AllowAny])  # ใช้ AllowAny เพื่อทดสอบ
def get_author_earnings(request):

    user_id = request.GET.get('user_id')

    if user_id:
        try:
            user = SystemUser.objects.get(userid=user_id)
        except SystemUser.DoesNotExist:
            return Response(
                {'error': f'ไม่พบผู้ใช้ ID {user_id}'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        # ถ้าไม่ระบุ user_id ให้ใช้ user แรกที่เป็น author
        user = SystemUser.objects.filter(role='author').first()
        if not user:
            return Response(
                {'error': 'ไม่พบนักเขียนในระบบ'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # ✅ ตรวจสอบ role โดยใช้ user ที่ได้มา
    if user.role != 'author':
        return Response(
            {'error': f'ผู้ใช้ {user.fullname} ไม่ใช่นักเขียน'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 1. ข้อมูลพื้นฐานของนักเขียน
    author_info = {
        'userid': user.userid,
        'fullname': user.fullname,
        'username': user.username,
        'email': user.email,
        'role': user.role
    }
    
    # 2. ยอดคงเหลือปัจจุบัน
    current_token_balance = get_current_token_balance(user)
    current_balance_baht = current_token_balance * 50
    
    # 3. จำนวนโทเค็นที่เป็นรายรับทั้งหมด
    total_tokens_earned = TransAccount.objects.filter(
        owner=user,
        paidtype='sellebook'
    ).aggregate(total=Sum('gettoken'))['total'] or 0
    
    total_baht_earned = total_tokens_earned * 50
    
    # 4. ดึงหนังสือทั้งหมด
    author_ebooks = eBook.objects.filter(author=user)
    
    # 5. คำนวณสถิติ
    books_data = []
    for ebook in author_ebooks:
        sales_count = TransAccount.objects.filter(
            paidtype='payebook',
            ebook=ebook
        ).count()
        
        total_tokens = TransAccount.objects.filter(
            paidtype='payebook',
            ebook=ebook
        ).aggregate(total=Sum('paidtoken'))['total'] or 0
        
        books_data.append({
            'ebookid': ebook.ebookid,
            'category': ebook.get_category_display(),
            'title': ebook.title,
            'cover': ebook.cover.url if ebook.cover else None,
            'token_per_book': ebook.ebooktoken,
            'price_baht': ebook.ebooktoken * 50,
            'sold_count': sales_count,
            'total_tokens_earned': total_tokens,
            'total_baht_earned': total_tokens * 50
        })
    
    # 6. เรียงลำดับ
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
            'total_sales': sum(book['sold_count'] for book in books_data)
        },
        'top_selling_books': top_10_books,
        'all_books': books_data
    }, status=status.HTTP_200_OK)
