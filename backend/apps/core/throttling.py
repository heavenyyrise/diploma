from rest_framework.throttling import SimpleRateThrottle


class PublicLeadThrottle(SimpleRateThrottle):
    scope = 'public_lead'

    def get_cache_key(self, request, view):
        if request.method != 'POST':
            return None
        ident = self.get_ident(request)
        user_id = request.data.get('user_id') or request.query_params.get('user_id') or ''
        return self.cache_format % {'scope': self.scope, 'ident': f'{ident}:{user_id}'}


class PublicFormThrottle(SimpleRateThrottle):
    scope = 'public_form'

    def get_cache_key(self, request, view):
        if request.method != 'GET':
            return None
        ident = self.get_ident(request)
        user_id = request.query_params.get('user_id') or ''
        return self.cache_format % {'scope': self.scope, 'ident': f'{ident}:{user_id}'}


class AuthRegisterThrottle(SimpleRateThrottle):
    scope = 'auth_register'


class AuthResendThrottle(SimpleRateThrottle):
    scope = 'auth_resend'
