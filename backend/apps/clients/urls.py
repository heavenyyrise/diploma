from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, LeadSourceViewSet, ContactTypeViewSet

router = DefaultRouter()
router.register('lead-sources', LeadSourceViewSet, basename='lead-sources')
router.register('contact-types', ContactTypeViewSet, basename='contact-types')
router.register('', ClientViewSet, basename='clients')

urlpatterns = [path('', include(router.urls))]
