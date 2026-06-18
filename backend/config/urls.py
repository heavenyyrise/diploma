from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/clients/', include('apps.clients.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/leads/', include('apps.leads.urls')),
    path('api/form-settings/', include('apps.form_settings.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]
