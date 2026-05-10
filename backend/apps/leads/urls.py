from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, LeadPublicCreateView
router = DefaultRouter()
router.register('', LeadViewSet, basename='leads')
urlpatterns = [
    path('public/', LeadPublicCreateView.as_view(), name='lead-public-create'),
    path('', include(router.urls)),
]
