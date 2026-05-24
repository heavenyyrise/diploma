class UserScopedMixin:
    """Filter queryset by request.user and auto-assign user on create."""

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated:
            return qs.filter(user=self.request.user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
