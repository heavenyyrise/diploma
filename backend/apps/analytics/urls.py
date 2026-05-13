from django.urls import path
from .views import IncomeByLeadSourceView, IncomeByMonthView, IncomeByServiceView, IncomeSummaryView, AvailableYearsView

urlpatterns = [
    path('income/by-lead-source/', IncomeByLeadSourceView.as_view()),
    path('income/by-month/', IncomeByMonthView.as_view()),
    path('income/by-service/', IncomeByServiceView.as_view()),
    path('income/summary/', IncomeSummaryView.as_view()),
    path('years/', AvailableYearsView.as_view()),
]
