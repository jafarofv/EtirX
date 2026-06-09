import logging
import json
from datetime import datetime

class StructuredFormatter(logging.Formatter):
    """
    Structured JSON log formatter for better observability.
    Outputs each log record as a JSON line with standard fields.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include any extra fields passed via extra={}
        for key in ("request_id", "user_id", "order_code", "ip"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val

        return json.dumps(log_entry, ensure_ascii=False, default=str)


def configure_logging(*, debug: bool = False) -> None:
    """
    Configure Django logging with structured JSON output for production
    and human-readable output for development.
    """
    root_logger = logging.getLogger()
    handler = logging.StreamHandler()

    if debug:
        handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] %(levelname)s %(name)s:%(lineno)d — %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
    else:
        handler.setFormatter(StructuredFormatter())

    root_logger.handlers = [handler]
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    # Keep noisy libraries quiet in production
    if not debug:
        logging.getLogger("django.db.backends").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)

    # Configure Django-specific loggers
    logging.getLogger("django.request").setLevel(logging.INFO)
    logging.getLogger("django.security").setLevel(logging.WARNING)

    logging.info("Logging configured (debug=%s)", debug)
