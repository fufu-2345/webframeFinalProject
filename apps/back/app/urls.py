from django.urls import path
from . import views
from .views import (topSellingBook , topBookByAuthor , transactionList)

urlpatterns = [
    path('users/create/', views.create_mock_user, name='create_mock_user'),
    path('ebooks/create/', views.create_mock_ebook, name='create_mock_ebook'),
    path('users/list/', views.list_mock_users, name='list_mock_users'),
    path('login/', views.login_user, name='login_user'),

    path('report/top-books/', topSellingBook, name='top_selling_books'),
    path('report/top-ebooks-author/', topBookByAuthor, name='top_books_by_author'),
    path('report/transactions/', transactionList, name='author_transactions'),

]