from django.apps import AppConfig
import threading

class Dashboard1Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Dashboard1'

    def ready(self):
        """
        Runs once when Django starts up.
        Triggers external API warm-up and preloads cache.
        """
        from .views import warmup_external_connection, warmup_cache
        
        # Run in background threads to avoid blocking server startup
        threading.Thread(target=warmup_external_connection, daemon=True).start()
        threading.Thread(target=warmup_cache, daemon=True).start()
