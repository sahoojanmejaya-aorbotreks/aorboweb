from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.urls import reverse
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.db.models import Q, Case, When, IntegerField
from django.conf import settings
from django.core.cache import cache
from datetime import datetime
import difflib
import threading

from .models import (
    Contact, Blog, TrekCategory, Trek, 
    Testimonial, FAQ, SafetyTip, TeamMember,
    HomepageBanner, WhatsNew, TopTrek, TrekList
)

def send_email_async(mail):
    threading.Thread(target=mail.send).start()


def get_featured_treks():
    cache_key = "featured_treks_qs"
    qs = cache.get(cache_key)

    if qs is not None:
        return qs

    qs = (
        TrekList.objects
        .prefetch_related('tags')
        .annotate(
            pin_order=Case(
                When(is_pinned=True, then=0),
                default=1,
                output_field=IntegerField()
            )
        )
        .order_by('pin_order', 'pin_priority', '-created_at')
    )

    cache.set(cache_key, qs, 60 * 10)  
    return qs


def get_trek_categories():
    cache_key = "trek_categories_all"
    categories = cache.get(cache_key)

    if categories is None:
        categories = TrekCategory.objects.all()
        cache.set(cache_key, categories, 60 * 60)

    return categories

def home(request):
    page_number = request.GET.get('page', 1)
    cache_key = f"home_page_{page_number}"
    cached_context = cache.get(cache_key)

    if cached_context:
        return render(request, 'index.html', cached_context)

    paginator = Paginator(get_featured_treks(), 8)
    page_obj = paginator.get_page(page_number)

    faq_categories = cache.get("faq_categories")
    if not faq_categories:
        faq_categories = {}
        for faq in FAQ.objects.all().order_by('category', 'order'):
            faq_categories.setdefault(faq.category, []).append(faq)
        cache.set("faq_categories", faq_categories, 60 * 60)

    context = {
        'featured_treks': page_obj.object_list,
        'page_obj': page_obj,
        'featured_testimonials': Testimonial.objects.filter(is_featured=True)[:6],
        'featured_blogs': Blog.objects.filter(is_featured=True)[:3],
        'banners': HomepageBanner.objects.filter(is_active=True).order_by('order'),
        'faq_categories': faq_categories,
        'whats_new': WhatsNew.objects.all().order_by('-created_at')[:5],
        'top_treks': TopTrek.objects.all()[:6],
    }

    cache.set(cache_key, context, 60 * 10)
    return render(request, 'index.html', context)


STOP_WORDS = {"best", "top", "places", "place", "near", "visit", "to", "trip", "trips", "treks", "trek"}

def normalize_text(text):
    return text.lower().strip()

def clean_query(query):
    return " ".join(w for w in normalize_text(query).split() if w not in STOP_WORDS)

def score_match(query, text):
    query, text = normalize_text(query), normalize_text(text)
    score = 0
    if text == query: score += 120
    if text.startswith(query): score += 100
    if any(w.startswith(query) for w in text.split()): score += 80
    if query in text: score += 60
    sim = difflib.SequenceMatcher(None, query, text).ratio()
    if sim > 0.6:
        score += int(sim * 40)
    return score

def typo_score(query, text):
    return int(difflib.SequenceMatcher(None, query, text).ratio() * 100)


def search_trek(request):
    query = request.GET.get("q", "").strip()
    if not query:
        return redirect("home")

    cleaned_query = clean_query(query)
    if not cleaned_query:
        return redirect("home")

    treks = (
        TrekList.objects
        .filter(
            Q(name__icontains=cleaned_query) |
            Q(state__icontains=cleaned_query) |
            Q(tags__name__icontains=cleaned_query)
        )
        .distinct()[:50] 
    )

    ranked = sorted(treks, key=lambda t: score_match(cleaned_query, t.name), reverse=True)

    if ranked:
        return redirect("card_trek_detail", ranked[0].id)

    return redirect("home")



def search_suggestions(request):
    query = request.GET.get("q", "").strip()

    if len(query) < 2:
        return JsonResponse({"results": []})

    # Cache search suggestions for 30 minutes
    cache_key = f"search_suggestions_{query_n := normalize_text(query)}"
    cached_results = cache.get(cache_key)
    if cached_results:
        return JsonResponse(cached_results)

    MAX_RESULTS = 8
    scored = []

    treks = (
        TrekList.objects
        .filter(name__istartswith=query_n)
        .only("id", "name", "state")[:30]
    )

    for trek in treks:
        name = trek.name or ""
        state = trek.state or ""
        score = 0

        if name.lower().startswith(query_n):
            score += 120

        for word in name.lower().split():
            if word.startswith(query_n):
                score += 90

        if score < 80:
            score = max(score, typo_score(query_n, name))

        if score < 60 and state:
            score = max(score, typo_score(query_n, state) - 10)

        if score >= 55:
            scored.append((score, trek))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    seen = set()

    for score, trek in scored[:MAX_RESULTS]:
        if trek.id in seen:
            continue

        results.append({
            "label": trek.name,
            "type": "trek",
            "url": reverse("card_trek_detail", args=[trek.id]),
        })
        seen.add(trek.id)

    if results:
        results.append({
            "label": f"Best treks near {query}",
            "type": "intent",
            "url": reverse("search_trek") + f"?q={query}",
        })

    response_data = {"results": results}
    cache.set(cache_key, response_data, 60 * 30) 
    return JsonResponse(response_data)

def about(request):
    """Render about page with cached team members."""
    cache_key = "about_page_team_members"
    team_members = cache.get(cache_key)
    
    if not team_members:
        team_members = TeamMember.objects.all().order_by('order')
        cache.set(cache_key, team_members, 60 * 60)  # 1 hour
    
    return render(request, 'about.html', {
        'team_members': team_members
    })

def blogs(request):
    """Render blogs page with pagination and caching."""
    page_number = request.GET.get('page', 1)
    cache_key = f"blogs_page_{page_number}"
    cached_page = cache.get(cache_key)
    
    if cached_page:
        return render(request, 'blogs.html', {'blogs': cached_page})
    
    paginator = Paginator(
        Blog.objects.only("id", "title", "slug", "created_at").order_by("-created_at"), 6)
    page_obj = paginator.get_page(page_number)
    
    cache.set(cache_key, page_obj, 60 * 30) 
    return render(request, 'blogs.html', {
        'blogs': page_obj
    })

def blog_detail(request, slug):
    blog = get_object_or_404(Blog, slug=slug)
    return render(request, 'blog_detail.html', {
        'blog': blog,
        'recent_blogs': (Blog.objects.only("title", "slug").exclude(id=blog.id)[:3])
        })

def treks(request):
    category_id = request.GET.get('category')
    difficulty = request.GET.get('difficulty')
    page_number = request.GET.get('page', 1)

    cache_key = f"treks_{page_number}_{category_id}_{difficulty}"
    cached = cache.get(cache_key)
    if cached:
        return render(request, 'treks.html', cached)

    qs = Trek.objects.all()
    if category_id:
        qs = qs.filter(category_id=category_id)
    if difficulty:
        qs = qs.filter(difficulty=difficulty)

    paginator = Paginator(qs, 12)
    page_obj = paginator.get_page(page_number)

    context = {
        'treks': page_obj,
        'categories': get_trek_categories(),
        'selected_category': category_id,
        'selected_difficulty': difficulty,
        'difficulty_choices': Trek.DIFFICULTY_CHOICES,
    }

    cache.set(cache_key, context, 60 * 30)
    return render(request, 'treks.html', context)

def trek_detail(request, slug):
    """Display detailed view of a trek with caching."""
    cache_key = f"trek_detail_{slug}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return render(request, 'trek_detail.html', cached_data)
    
    trek = get_object_or_404(Trek, slug=slug)
    context = {
        'trek': trek,
        'testimonials': trek.testimonials.all(),
        'similar_treks': Trek.objects.filter(category=trek.category).exclude(id=trek.id)[:3],
    }
    
    cache.set(cache_key, context, 60 * 60)  # 1 hour
    return render(request, 'trek_detail.html', context)

def safety(request):
    """Render safety page with cached safety tips."""
    cache_key = "safety_page_tips"
    safety_tips = cache.get(cache_key)
    
    if not safety_tips:
        safety_tips = SafetyTip.objects.all().order_by('order')
        cache.set(cache_key, safety_tips, 60 * 60)  # 1 hour
    
    return render(request, 'safety.html', {
        'safety_tips': safety_tips
    })

def detect_trek_category(message: str):
    message = message.lower()

    if any(word in message for word in ["adventure", "hills", "mountain", "climb"]):
        return "adventure"

    if any(word in message for word in ["camp", "camping", "tent", "bonfire"]):
        return "camping"

    if any(word in message for word in ["nature", "green", "greenery", "forest", "waterfall"]):
        return "nature"

    if any(word in message for word in ["beach", "sea", "coast"]):
        return "beach"

    if any(word in message for word in ["spiritual", "temple", "holy", "pilgrimage"]):
        return "spiritual"

    if any(word in message for word in ["weekend", "short trip", "getaway"]):
        return "weekend"

    return None

def contact(request):

    if request.method == "GET":
        return render(request, "contact.html")
    
    name = request.POST.get("name")
    email = request.POST.get("email")
    mobile = request.POST.get("mobile")
    user_type = request.POST.get("user_type")   # trekker / organizer / other
    message = request.POST.get("comment")
    trek_category = request.POST.get("trek_category")  # Category selected in dropdown

    # Validate all required fields
    if not all([name, email, mobile, user_type, message]):
        return JsonResponse({"error": "Please fill all required fields"}, status=400)

    # Save to database
    Contact.objects.create(
        name=name, email=email, mobile=mobile,
        user_type=user_type, comment=message
    )

    TREK_LINKS = {
        "adventure": "https://www.aorbotreks.com/travel-your-way/?tag=adventure",
        "camping": "https://www.aorbotreks.com/travel-your-way/?tag=camping",
        "nature": "https://www.aorbotreks.com/travel-your-way/?tag=nature",
        "beach": "https://www.aorbotreks.com/travel-your-way/?tag=beach",
        "spiritual": "https://www.aorbotreks.com/travel-your-way/?tag=spiritual",
        "weekend": "https://www.aorbotreks.com/travel-your-way/?tag=weekend",
    }
    detected_category = None
    explore_link = "https://www.aorbotreks.com"
    subject = "We've Received Your Query – Aorbo Treks"
    template_name = "emails/contact_default.html"

    if user_type == "trekker":
        if trek_category:
            detected_category = trek_category
        else:
            detected_category = detect_trek_category(message)
        
        explore_link = TREK_LINKS.get(
            detected_category,
            "https://www.aorbotreks.com/treks"
        )
        subject = f"{detected_category.title() if detected_category else 'Explore'} Treks – Aorbo Treks"
        template_name = "emails/trekker.html"

    elif user_type == "organizer":
        explore_link = "https://partner.aorbotreks.com"
        subject = "Partnership Request – Aorbo Treks"
        template_name = "emails/organizer.html"

    else:
        explore_link = "https://www.aorbotreks.com"
        subject = "We've Received Your Query – Aorbo Treks"
        template_name = "emails/other.html"

    display_category = detected_category.title() if detected_category else "Our Featured"
    
    context = {
        "name": name,
        "email": email,
        "message": message,
        "detected_category": detected_category,
        "display_category": display_category,
        "explore_link": explore_link,
        "current_year": datetime.now().year,
    }

    html_content = render_to_string(template_name, context)

    try:
        mail = EmailMultiAlternatives(
            subject=subject,
            body="Thank you for contacting Aorbo Treks.",
            from_email="Aorbo Treks <" + settings.DEFAULT_FROM_EMAIL + ">",
            to=[email],
        )
        mail.attach_alternative(html_content, "text/html")
        # mail.send()
        send_email_async(mail)
    except Exception as e:
        return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

    return JsonResponse({"message": "Message sent successfully"})

def travel_your_way(request):
    """Display treks filtered by selected tag."""
    selected_tag = request.GET.get("tag")
    if not selected_tag:
        return redirect("home")

    treks = TrekList.objects.filter(tags__name__iexact=selected_tag).distinct()
    return render(request, "travel_your_way.html", {
        "selected_tag": selected_tag,
        "treks": treks,
    })


def card_trek_detail(request, slug):
    """Display detailed view of a trek with related treks."""
    trek = get_object_or_404(TrekList, id=slug)
    related_treks = trek.related_treks.all() if hasattr(trek, "related_treks") else TrekList.objects.none()
    
    activities_list = [a.strip() for a in trek.activities.split(",")] if trek.activities else []

    return render(request, "card_details.html", {
        "trek": trek,
        "related_treks": related_treks,
        "activities_list": activities_list,
    })


def privacy_policy(request):
    return render(request, "privacypolicy.html")

def terms_and_conditions(request):
    return render(request, "terms_and_conditions.html")

def user_agreement(request):
    return render(request, "user_agreement.html")
