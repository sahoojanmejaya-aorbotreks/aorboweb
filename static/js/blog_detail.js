document.addEventListener('DOMContentLoaded', function () {
    (function injectBlogBreadcrumbSchema() {
        if (document.getElementById('aorbo-blog-breadcrumb')) return;

        const titleEl = document.querySelector('.blog-title');
        if (!titleEl) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://aorbotreks.com/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Blogs",
                    "item": "https://aorbotreks.com/blogs/"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": titleEl.textContent.trim(),
                    "item": window.location.href
                }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'aorbo-blog-breadcrumb';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    })();

    /* ======================================================
       TOC GENERATION
       ====================================================== */
    const blogContent = document.getElementById('blogContent');
    const tocNav = document.getElementById('toc-nav');

    if (!blogContent || !tocNav) {
        console.error('❌ Blog content or TOC nav element not found');
        return;
    }

    const headings = Array.from(blogContent.querySelectorAll('h2, h3'));
    const uniqueHeadings = [];
    const seenHeadings = new Set();

    headings.forEach(heading => {
        const key = `${heading.tagName}-${heading.textContent.trim()}`;
        if (!seenHeadings.has(key)) {
            seenHeadings.add(key);
            uniqueHeadings.push(heading);
        }
    });

    if (uniqueHeadings.length > 0) {
        uniqueHeadings.forEach((heading, index) => {
            const id = heading.id || `section-${index}`;
            heading.id = id;

            const a = document.createElement('a');
            a.href = `#${id}`;
            a.className = 'sidebar-link';
            a.textContent = heading.textContent;
            tocNav.appendChild(a);
        });
        tocNav.style.display = 'block';
    } else {
        tocNav.innerHTML =
            '<p style="font-size:12px;color:#999;">No headings found in this article</p>';
    }

    /* ======================================================
       SHARE BUTTONS
       ====================================================== */
    const shareButtons = document.querySelectorAll('.share-btn');
    const currentUrl = window.location.href;
    const pageTitle =
        document.querySelector('.blog-title')?.textContent.trim() || document.title;

    function flashButton(btn, message) {
        const original = btn.innerHTML;
        btn.innerHTML = `<span>${message}</span>`;
        btn.classList.add('share-feedback');
        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('share-feedback');
        }, 2000);
    }

    shareButtons.forEach(btn => {
        const type = btn.dataset.share;
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            let url = '';
            if (type === 'facebook') {
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
            } else if (type === 'twitter') {
                url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(pageTitle)}`;
            } else if (type === 'linkedin') {
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
            } else if (type === 'copy') {
                navigator.clipboard.writeText(currentUrl)
                    .then(() => flashButton(btn, '✓ Copied'))
                    .catch(() => flashButton(btn, 'Copied'));
                return;
            }

            window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
        });
    });

    /* ======================================================
       SCROLLSPY FOR TOC
       ====================================================== */
    const tocLinks = Array.from(tocNav.querySelectorAll('.sidebar-link'));
    const headingMap = new Map();

    tocLinks.forEach(link => {
        const id = link.getAttribute('href')?.slice(1);
        const el = document.getElementById(id);
        if (el) {
            headingMap.set(id, { link, el });
            link.addEventListener('click', (e) => {
                e.preventDefault();
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => el.focus({ preventScroll: true }), 300);
            });
        }
    });

    if ('IntersectionObserver' in window && headingMap.size) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                tocLinks.forEach(l => l.classList.remove('active'));
                headingMap.get(entry.target.id)?.link.classList.add('active');
            });
        }, { rootMargin: '0px 0px -60% 0px' });

        headingMap.forEach(({ el }) => observer.observe(el));
    }

});
