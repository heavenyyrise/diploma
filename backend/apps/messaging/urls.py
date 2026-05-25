from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, SendEmailView, SentEmailListView

router = DefaultRouter()
router.register('templates', EmailTemplateViewSet, basename='email-templates')

urlpatterns = [
    path('send/', SendEmailView.as_view(), name='send-email'),
    path('sent/', SentEmailListView.as_view(), name='sent-emails'),
    path('', include(router.urls)),
]
