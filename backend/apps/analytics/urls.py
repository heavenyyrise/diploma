from django.urls import path
from .views import (
    IncomeByLeadSourceView,
    IncomeByClientTypeView,
    NewClientsByLeadSourceView,
    IncomeByMonthView,
    IncomeByServiceView,
    IncomeSummaryView,
    AvailableYearsView,
)

urlpatterns = [
    path('income/by-lead-source/', IncomeByLeadSourceView.as_view()),
    path('income/by-client-type/', IncomeByClientTypeView.as_view()),
    path('clients/new-by-lead-source/', NewClientsByLeadSourceView.as_view()),
    path('income/by-month/', IncomeByMonthView.as_view()),
    path('income/by-service/', IncomeByServiceView.as_view()),
    path('income/summary/', IncomeSummaryView.as_view()),
    path('years/', AvailableYearsView.as_view()),
]
