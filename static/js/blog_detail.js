 document.addEventListener('DOMContentLoaded', function() {
        const blogContent = document.getElementById('blogContent');
        const tocNav = document.getElementById('toc-nav');
        
        if (!blogContent || !tocNav) {
            console.error('❌ Blog content or TOC nav element not found');
            return;
        }
        
        // Find only direct h2, h3 headings (not nested in other elements)
        const headings = Array.from(blogContent.querySelectorAll('h2, h3'));
        
        // Filter to remove duplicates (same text, same level)
        const uniqueHeadings = [];
        const seenHeadings = new Set();
        
        headings.forEach(heading => {
            const key = `${heading.tagName}-${heading.textContent.trim()}`;
            if (!seenHeadings.has(key)) {
                seenHeadings.add(key);
                uniqueHeadings.push(heading);
            }
        });
        
        console.log('Found headings:', headings.length);
        console.log('Unique headings:', uniqueHeadings.length);
        
        if (uniqueHeadings.length > 0) {
            uniqueHeadings.forEach((heading, index) => {
                const id = heading.id || `section-${index}`;
                heading.id = id;
                
                const a = document.createElement('a');
                a.href = `#${id}`;
                a.className = 'sidebar-link';
                a.textContent = heading.textContent;
                tocNav.appendChild(a);
                console.log(`✓ Added TOC link: ${heading.textContent.substring(0, 30)}`);
            });
            console.log('✓ Table of Contents populated successfully');
            tocNav.style.display = 'block';
        } else {
            console.warn('⚠️ No headings (h2, h3) found in blog content');
            tocNav.innerHTML = '<p style="font-size: 12px; color: #999;">No headings found in this article</p>';
        }

        // Share buttons (use data-share attribute for order-independent behavior)
        const shareButtons = document.querySelectorAll('.share-btn');
        const currentUrl = window.location.href;
        const titleElement = document.querySelector('.blog-title');
        const pageTitle = titleElement ? titleElement.textContent.trim() : document.title;

        function flashButton(btn, message) {
            const original = btn.innerHTML;
            btn.innerHTML = `<span>${message}</span>`;
            btn.setAttribute('aria-live', 'polite');
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
                if (type === 'facebook') {
                    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
                    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
                } else if (type === 'twitter') {
                    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(pageTitle)}`;
                    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
                } else if (type === 'linkedin') {
                    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
                    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
                } else if (type === 'copy') {
                    navigator.clipboard.writeText(currentUrl).then(() => {
                        flashButton(btn, '✓ Copied');
                    }).catch(() => {
                        // fallback for older browsers
                        flashButton(btn, 'Copied');
                    });
                }
            });
        });

        // Scrollspy: highlight TOC link for visible headings
        const tocLinks = Array.from(document.querySelectorAll('#toc-nav .sidebar-link'));
        const headingMap = new Map();
        tocLinks.forEach(link => {
            const targetId = link.getAttribute('href') && link.getAttribute('href').slice(1);
            if (targetId) {
                const el = document.getElementById(targetId);
                if (el) headingMap.set(targetId, { link, el });
                // make link use smooth scroll with offset handled by CSS scroll-margin-top
                link.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // focus for keyboard users
                    setTimeout(() => el.focus({ preventScroll: true }), 300);
                });
            }
        });

        if ('IntersectionObserver' in window && headingMap.size > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const id = entry.target.id;
                    const item = headingMap.get(id);
                    if (!item) return;
                    if (entry.isIntersecting) {
                        tocLinks.forEach(l => l.classList.remove('active'));
                        item.link.classList.add('active');
                    }
                });
            }, { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0 });

            headingMap.forEach(({ el }) => observer.observe(el));
        }
    });