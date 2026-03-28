from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .createTemp import CreateTempSerializer, EbookSerializer
from app.models import SystemUser, eBook
from django.core.files.storage import default_storage

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