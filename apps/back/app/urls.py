from django.urls import path
from . import views
from .views import (topSellingBook , topBookByAuthor , transactionList)

urlpatterns = [
    path('users/create/', views.create_mock_user, name='create_mock_user'),
    path('ebooks/create/', views.create_mock_ebook, name='create_mock_ebook'),
    path('users/list/', views.list_mock_users, name='list_mock_users'),
    path('users/me/', views.current_user_profile, name='current_user_profile'),
    path('users/payments/', views.my_payment_requests, name='my_payment_requests'),
    path('csrf/', views.csrf_token, name='csrf_token'),
    path('topup/plans/', views.topup_plan_list, name='topup_plan_list'),
    path('login/', views.login_user, name='login_user'),

    path('report/top-books/', topSellingBook, name='top_selling_books'),
    path('report/top-ebooks-author/', topBookByAuthor, name='top_books_by_author'),
    path('report/transactions/', transactionList, name='author_transactions'),

    path('user/topup/request/', views.request_topup, name='request_topup'),
    path('user/my-transactions/', views.transactionList, name='user_transactions'),

    path('author/subscription/request/', views.request_subscription, name='request_subscription'),
    path('author/status/', views.author_status, name='author_status'),
    path('author/top-books/', views.topBookByAuthor, name='author_top_books'),
    path('author/earnings/', views.transactionList, name='author_earnings'),
    path('admin/payments/pending/', views.list_pending_payments, name='pending_payments'),
    path('admin/payments/verify/', views.verify_payment, name='verify_payment'),
    path('admin/topup/', views.admin_topup_list, name='admin_topup_list'),
    path('admin/subscription/', views.admin_subscription_list, name='admin_subscription_list'),
]
