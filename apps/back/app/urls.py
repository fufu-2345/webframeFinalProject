from django.urls import path
from . import views

urlpatterns = [
    path('users/create/', views.create_mock_user, name='create_mock_user'),
    path('users/list/', views.list_mock_users, name='list_mock_users'),
    path('login/', views.login_user, name='login_user'),
    path('ebooks/list/', views.list_ebooks, name='list_ebooks'),
    path('payment/purchase/', views.purchase_ebook, name='purchase_ebook'),
    path('users/<int:userid>/balance/', views.get_user_balance, name='get_user_balance'),

    path("ebooks/create/", views.create_mock_ebook, name="create_mock_ebook"),
    path("csrf/", views.get_csrf_token, name="get_csrf_token"),
    
    # Payment & Subscriptions (สำหรับฝั่ง User)
    path("payment/subscription-info/", views.get_subscription_info, name="payment_get_sub_info"),
    path("payment/subscribe/", views.request_subscription, name="payment_request_sub"),
    path("payment/topup/plans/", views.list_topup_plans, name="payment_list_plans"),
    path("payment/topup/request/", views.request_topup, name="payment_request_topup"),
    path("payment/ebook/purchase/", views.purchase_ebook, name="payment_purchase_ebook"),
    
    # Admin Approval (สำหรับฝั่ง Staff)
    path("admin/payments/pending/", views.list_pending_payments, name="admin_list_pending"),
    path("admin/payments/verify/", views.verify_payment, name="admin_verify_payment"),
]
