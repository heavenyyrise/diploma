from django.urls import path
from .views import IncomeByPlatformView, IncomeByMonthView, IncomeByServiceView, IncomeSummaryView, AvailableYearsView
urlpatterns = [
    path('income/by-platform/', IncomeByPlatformView.as_view()),
    path('income/by-month/', IncomeByMonthView.as_view()),
    path('income/by-service/', IncomeByServiceView.as_view()),
    path('income/summary/', IncomeSummaryView.as_view()),
    path('years/', AvailableYearsView.as_view()),
]
