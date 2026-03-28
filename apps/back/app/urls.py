from django.urls import path
from . import views

urlpatterns = [
    path('users/create/', views.create_mock_user, name='create_mock_user'),
    path('ebooks/create/', views.create_mock_ebook, name='create_mock_ebook'),
    path('users/list/', views.list_mock_users, name='list_mock_users'),
    path('login/', views.login_user, name='login_user'),
]