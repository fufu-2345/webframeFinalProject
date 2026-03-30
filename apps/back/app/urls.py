from django.urls import path
from . import views
from .views import (topSellingBook , topBookByAuthor , transactionList)

urlpatterns = [
    path('users/create/', views.create_mock_user, name='create_mock_user'),
    path('users/list/', views.list_mock_users, name='list_mock_users'),
    path('users/me/', views.current_user_profile, name='current_user_profile'),
    path('users/payments/', views.my_payment_requests, name='my_payment_requests'),
    path('users/<int:userid>/balance/', views.get_user_balance, name='get_user_balance'),
    path('login/', views.login_user, name='login_user'),
    path('logout/', views.logout_user, name='logout_user'),

    path('ebooks/create/', views.create_mock_ebook, name='create_mock_ebook'),
    path('ebooks/list/', views.list_ebooks, name='list_ebooks'),
    path('csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('topup/plans/', views.topup_plan_list, name='topup_plan_list'),
    path('payment/topup/plans/', views.list_topup_plans, name='payment_list_plans'),

    path('report/top-books/', topSellingBook, name='top_selling_books'),
    path('report/top-ebooks-author/', topBookByAuthor, name='top_books_by_author'),
    path('report/transactions/', transactionList, name='author_transactions'),

    path('user/topup/request/', views.request_topup, name='request_topup'),
    path('payment/subscription-info/', views.get_subscription_info, name='payment_get_sub_info'),
    path('payment/subscribe/', views.request_subscription, name='payment_request_sub'),
    path('author/subscription/request/', views.request_subscription, name='request_subscription'),

    path('payment/ebook/purchase/', views.purchase_ebook, name='payment_purchase_ebook'),
    path('payment/purchase/', views.purchase_ebook, name='purchase_ebook'),

    path('author/status/', views.author_status, name='author_status'),
    path('author/top-books/', views.topBookByAuthor, name='author_top_books'),
    path('author/earnings/', views.transactionList, name='author_earnings'),
    path('author/earnings/stats/', views.get_author_earnings, name='get_author_earnings'),
    path('user/my-transactions/', views.transactionList, name='user_transactions'),

    path('admin/payments/pending/', views.list_pending_payments, name='pending_payments'),
    path('admin/payments/verify/', views.verify_payment, name='verify_payment'),
    path('admin/topup/', views.admin_topup_list, name='admin_topup_list'),
    path('admin/subscription/', views.admin_subscription_list, name='admin_subscription_list'),

    path('history/', views.payment_history, name='payment_history'),
    path('payments/search/', views.search_payment),
    path('trans/search/', views.search_transaccount),
]
