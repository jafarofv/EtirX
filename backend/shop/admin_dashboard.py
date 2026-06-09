"""
Custom admin dashboard with statistics view.
"""
import json
from datetime import timedelta
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count, Sum, Q
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from .models import Order, Product, User, ContactMessage


@staff_member_required
def admin_dashboard_html(request):
    """Render the custom admin dashboard page."""
    context = {
        "title": "EtirX Dashboard",
    }
    return render(request, "admin/dashboard.html", context)


@staff_member_required
def admin_statistics(request):
    """JSON endpoint returning dashboard statistics."""
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = this_month_start - timedelta(seconds=1)

    # Order stats
    total_orders = Order.objects.count()
    orders_today = Order.objects.filter(created_at__gte=today_start).count()
    orders_this_month = Order.objects.filter(created_at__gte=this_month_start).count()
    orders_last_month = Order.objects.filter(
        created_at__gte=last_month_start, created_at__lte=last_month_end
    ).count()

    # Revenue stats
    revenue_this_month = (
        Order.objects.filter(created_at__gte=this_month_start)
        .aggregate(total=Sum("total"))["total"]
        or 0
    )
    revenue_last_month = (
        Order.objects.filter(
            created_at__gte=last_month_start, created_at__lte=last_month_end
        )
        .aggregate(total=Sum("total"))["total"]
        or 0
    )

    # Order status breakdown
    status_breakdown = dict(
        Order.objects.values("status")
        .annotate(count=Count("id"))
        .values_list("status", "count")
    )

    # Product stats
    total_products = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    out_of_stock = Product.objects.filter(is_active=True, stock=0).count()
    low_stock = Product.objects.filter(is_active=True, stock__gt=0, stock__lte=5).count()

    # User stats
    total_users = User.objects.count()
    new_users_today = User.objects.filter(date_joined__gte=today_start).count()
    new_users_this_month = User.objects.filter(date_joined__gte=this_month_start).count()

    # Unread messages
    unread_messages = ContactMessage.objects.filter(is_read=False).count()

    # Recent orders (last 10)
    recent_orders = list(
        Order.objects.order_by("-created_at")[:10].values(
            "code", "full_name", "phone", "status", "total", "created_at"
        )
    )

    # Monthly revenue chart data (last 6 months)
    monthly_revenue = []
    for i in range(5, -1, -1):
        month_start = (this_month_start - timedelta(days=i * 30)).replace(day=1)
        if i == 0:
            month_end = now
        else:
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        total = (
            Order.objects.filter(
                created_at__gte=month_start, created_at__lte=month_end
            ).aggregate(total=Sum("total"))["total"]
            or 0
        )
        monthly_revenue.append(
            {
                "month": month_start.strftime("%B"),
                "revenue": float(total),
            }
        )

    return JsonResponse(
        {
            "orders": {
                "total": total_orders,
                "today": orders_today,
                "this_month": orders_this_month,
                "last_month": orders_last_month,
            },
            "revenue": {
                "this_month": float(revenue_this_month),
                "last_month": float(revenue_last_month),
                "monthly": monthly_revenue,
            },
            "status_breakdown": status_breakdown,
            "products": {
                "total": total_products,
                "active": active_products,
                "out_of_stock": out_of_stock,
                "low_stock": low_stock,
            },
            "users": {
                "total": total_users,
                "new_today": new_users_today,
                "new_this_month": new_users_this_month,
            },
            "messages": {
                "unread": unread_messages,
            },
            "recent_orders": [
                {
                    **order,
                    "total": str(order["total"]),
                    "created_at": order["created_at"].isoformat(),
                }
                for order in recent_orders
            ],
        }
    )
