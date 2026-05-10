from django.urls import path
from .views import FormSettingsView, FormSettingsPublicView
urlpatterns = [
    path('', FormSettingsView.as_view()),
    path('public/', FormSettingsPublicView.as_view()),
]
