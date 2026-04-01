<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en">
<head>
  <title>Sitemap — Ecco Facilities LLC</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="crossorigin"/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=Cormorant+Garamond:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
  <style>
    :root{--navy:#0B1D38;--navy-l:#15294D;--blue:#3068AD;--green:#2D7A32;--green-l:#3D9A43;--cream:#F3F5F8;--wh:#FFF;--bg:#FAFBFC;--td:#1A1E2C;--tb:#495568;--tm:#6B7A8D;--tl:#94A3B5;--bl:#DFE4EC;--bll:#EDF0F5;--twm:#B8C7D6}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--td);line-height:1.6;-webkit-font-smoothing:antialiased}
    a{text-decoration:none;color:inherit}

    /* Nav */
    .nav{padding:0 3.5rem;height:72px;display:flex;justify-content:space-between;align-items:center;background:rgba(250,251,252,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--bll);position:sticky;top:0;z-index:100}
    .nav-logo-img{height:36px}
    .nav-link{font-size:.82rem;font-weight:600;color:var(--tb);padding:.55rem 1.5rem;border:1px solid var(--bl);border-radius:10px;transition:all .3s}
    .nav-link:hover{background:var(--navy);color:var(--wh);border-color:var(--navy)}

    /* Hero */
    .hero{background:var(--navy);padding:5rem 2rem 4rem;text-align:center;position:relative;overflow:hidden}
    .hero-img{position:absolute;inset:0;background:url('images/stock/hero-office.jpg') center/cover;opacity:.1}
    .hero::before{content:'';position:absolute;top:-20%;right:-10%;width:400px;height:400px;background:radial-gradient(circle,rgba(48,104,173,.25) 0%,transparent 60%);border-radius:50%;filter:blur(60px)}
    .hero::after{content:'';position:absolute;bottom:-15%;left:-8%;width:350px;height:350px;background:radial-gradient(circle,rgba(45,122,50,.2) 0%,transparent 60%);border-radius:50%;filter:blur(60px)}
    .breadcrumb{display:inline-flex;align-items:center;gap:.5rem;font-size:.75rem;color:var(--twm);margin-bottom:1.5rem;font-weight:500;position:relative;z-index:1}
    .breadcrumb a{color:var(--blue);transition:color .3s}
    .breadcrumb a:hover{color:var(--wh)}
    .hero-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem .9rem .35rem .7rem;background:rgba(45,122,50,.15);border:1px solid rgba(45,122,50,.3);border-radius:50px;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--green-l);margin-bottom:1.5rem;position:relative;z-index:1}
    .pd{width:7px;height:7px;background:var(--green-l);border-radius:50%;box-shadow:0 0 6px rgba(61,154,67,.5);display:inline-block;animation:pulse 2.5s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.8)}}
    .hero h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(2.2rem,4.5vw,3.2rem);font-weight:500;color:var(--wh);margin-bottom:.5rem;position:relative;z-index:1;letter-spacing:-.02em}
    .hero-sub{color:var(--twm);font-size:1rem;position:relative;z-index:1;max-width:480px;margin:0 auto;line-height:1.75}
    .hero-count{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.5rem;padding:.5rem 1.2rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:50px;position:relative;z-index:1}
    .hero-count-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.4rem;font-weight:600;color:var(--wh)}
    .hero-count-label{font-size:.78rem;color:var(--twm)}

    /* Container */
    .container{max-width:1000px;margin:0 auto;padding:3rem 2rem 2rem}

    /* Category */
    .category{margin-bottom:2.5rem}
    .cat-label{display:inline-flex;align-items:center;gap:.5rem;font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--green);margin-bottom:1.2rem;background:rgba(45,122,50,.07);padding:.35rem .9rem .35rem .5rem;border-radius:50px}
    .cat-label::before{content:'';width:14px;height:2px;background:var(--green);border-radius:2px}

    /* Card Grid */
    .card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
    .card{background:var(--wh);border:1px solid var(--bl);border-radius:14px;padding:1.4rem 1.6rem;transition:all .35s cubic-bezier(.4,0,.2,1);display:flex;gap:1rem;align-items:flex-start}
    .card:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(11,29,56,.1);border-color:var(--blue);background:linear-gradient(135deg,var(--wh) 0%,#f8faff 100%)}
    .card-ico{width:42px;height:42px;min-width:42px;display:flex;align-items:center;justify-content:center;background:var(--cream);border-radius:12px;color:var(--navy);transition:all .3s}
    .card:hover .card-ico{background:var(--navy);color:var(--wh)}
    .card-body{flex:1;min-width:0}
    .card-name{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:600;color:var(--navy);margin-bottom:.2rem}
    .card-desc{font-size:.78rem;color:var(--tm);line-height:1.5;margin-bottom:.6rem}
    .card-meta{display:flex;align-items:center;gap:.8rem}
    .card-date{font-size:.68rem;color:var(--tl)}
    .priority{display:inline-flex;padding:.15rem .5rem;border-radius:50px;font-size:.65rem;font-weight:700}
    .p-high{background:rgba(45,122,50,.1);color:var(--green)}
    .p-med{background:rgba(48,104,173,.1);color:var(--blue)}
    .p-low{background:rgba(107,122,141,.1);color:var(--tm)}

    /* CTA */
    .cta{background:linear-gradient(135deg,var(--navy) 0%,var(--navy-l) 50%,#1E3562 100%);padding:3.5rem 2rem;text-align:center;position:relative;overflow:hidden}
    .cta::before{content:'';position:absolute;top:-40%;right:-15%;width:400px;height:400px;background:radial-gradient(circle,rgba(48,104,173,.15) 0%,transparent 60%);border-radius:50%}
    .cta h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(1.4rem,2.5vw,2rem);color:var(--wh);font-weight:500;margin-bottom:.5rem;position:relative;z-index:1}
    .cta p{color:var(--twm);font-size:.92rem;margin-bottom:1.5rem;position:relative;z-index:1}
    .cta-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 2.2rem;background:var(--wh);color:var(--navy);font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:600;border-radius:12px;transition:all .3s;position:relative;z-index:1}
    .cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(0,0,0,.2)}

    /* Footer */
    .footer{background:var(--navy);padding:2rem 2rem;text-align:center;position:relative}
    .footer::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--green),var(--blue),var(--green))}
    .footer-links{display:flex;justify-content:center;gap:1.5rem;margin-bottom:.8rem;flex-wrap:wrap}
    .footer-links a{font-size:.8rem;color:var(--twm);transition:color .3s}
    .footer-links a:hover{color:var(--wh)}
    .footer-copy{font-size:.7rem;color:var(--twm);opacity:.5}

    @media(max-width:768px){
      .hero{padding:4rem 1.5rem 3rem}
      .container{padding:2rem 1.5rem}
      .nav{padding:0 1.5rem}
      .card{padding:1.2rem}
    }
    @media(max-width:480px){
      .card{flex-direction:column;gap:.6rem}
      .card-ico{width:36px;height:36px;min-width:36px}
      .nav{height:60px}
      .cta{padding:2.5rem 1.5rem}
    }
  </style>
</head>
<body>
  <!-- NAV -->
  <div class="nav">
    <a href="index.html"><img src="images/logo-horizontal.png" alt="Ecco Facilities" class="nav-logo-img"/></a>
    <a href="index.html" class="nav-link">← Back to Site</a>
  </div>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-img">&#160;</div>
    <div class="breadcrumb"><a href="index.html">Home</a> <span>/</span> <span style="color:var(--wh);opacity:.7">Sitemap</span></div>
    <div class="hero-badge"><span class="pd">&#160;</span> Site Directory</div>
    <h1>All Pages</h1>
    <p class="hero-sub">Complete directory of every page on eccofacilities.com</p>
    <div class="hero-count">
      <span class="hero-count-num"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
      <span class="hero-count-label">pages indexed</span>
    </div>
  </div>

  <div class="container">

    <!-- MAIN PAGES -->
    <div class="category">
      <div class="cat-label">Main Pages</div>
      <div class="card-grid">
        <xsl:for-each select="sitemap:urlset/sitemap:url[sitemap:loc='https://eccofacilities.com/' or contains(sitemap:loc,'services.html') or (contains(sitemap:loc,'quote.html') and not(contains(sitemap:loc,'quote-')))]">
          <a href="{sitemap:loc}" class="card">
            <div class="card-ico">
              <xsl:choose>
                <xsl:when test="sitemap:loc='https://eccofacilities.com/'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></xsl:when>
                <xsl:when test="contains(sitemap:loc,'services')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><path d="M9 22v-4h6v4"/></svg></xsl:when>
                <xsl:otherwise><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></xsl:otherwise>
              </xsl:choose>
            </div>
            <div class="card-body">
              <div class="card-name"><xsl:choose><xsl:when test="sitemap:loc='https://eccofacilities.com/'">Home</xsl:when><xsl:when test="contains(sitemap:loc,'services.html')">All Services</xsl:when><xsl:when test="contains(sitemap:loc,'quote.html')">Request a Quote</xsl:when></xsl:choose></div>
              <div class="card-desc"><xsl:choose><xsl:when test="sitemap:loc='https://eccofacilities.com/'">Main landing page with service overview</xsl:when><xsl:when test="contains(sitemap:loc,'services.html')">Janitorial and day porter services overview</xsl:when><xsl:when test="contains(sitemap:loc,'quote.html')">Get a free customized cleaning proposal</xsl:when></xsl:choose></div>
              <div class="card-meta"><span class="card-date"><xsl:value-of select="sitemap:lastmod"/></span><xsl:choose><xsl:when test="sitemap:priority >= 0.8"><span class="priority p-high"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:when test="sitemap:priority >= 0.5"><span class="priority p-med"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:otherwise><span class="priority p-low"><xsl:value-of select="sitemap:priority"/></span></xsl:otherwise></xsl:choose></div>
            </div>
          </a>
        </xsl:for-each>
      </div>
    </div>

    <!-- SERVICES -->
    <div class="category">
      <div class="cat-label">Services</div>
      <div class="card-grid">
        <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'janitorial') or contains(sitemap:loc,'day-porter')]">
          <a href="{sitemap:loc}" class="card">
            <div class="card-ico">
              <xsl:choose>
                <xsl:when test="contains(sitemap:loc,'janitorial')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></xsl:when>
                <xsl:otherwise><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></xsl:otherwise>
              </xsl:choose>
            </div>
            <div class="card-body">
              <div class="card-name"><xsl:choose><xsl:when test="sitemap:loc='https://eccofacilities.com/janitorial.html'">Janitorial Services</xsl:when><xsl:when test="sitemap:loc='https://eccofacilities.com/day-porter.html'">Day Porter Services</xsl:when><xsl:when test="contains(sitemap:loc,'quote-janitorial')">Janitorial Quote</xsl:when><xsl:when test="contains(sitemap:loc,'quote-dayporter')">Day Porter Quote</xsl:when></xsl:choose></div>
              <div class="card-desc"><xsl:choose><xsl:when test="sitemap:loc='https://eccofacilities.com/janitorial.html'">Scheduled recurring cleaning for your facility</xsl:when><xsl:when test="sitemap:loc='https://eccofacilities.com/day-porter.html'">On-site professional during business hours</xsl:when><xsl:when test="contains(sitemap:loc,'quote-janitorial')">Start your janitorial service quote</xsl:when><xsl:when test="contains(sitemap:loc,'quote-dayporter')">Start your day porter service quote</xsl:when></xsl:choose></div>
              <div class="card-meta"><span class="card-date"><xsl:value-of select="sitemap:lastmod"/></span><xsl:choose><xsl:when test="sitemap:priority >= 0.8"><span class="priority p-high"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:when test="sitemap:priority >= 0.5"><span class="priority p-med"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:otherwise><span class="priority p-low"><xsl:value-of select="sitemap:priority"/></span></xsl:otherwise></xsl:choose></div>
            </div>
          </a>
        </xsl:for-each>
      </div>
    </div>

    <!-- COMPANY -->
    <div class="category">
      <div class="cat-label">Company</div>
      <div class="card-grid">
        <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'about') or contains(sitemap:loc,'why-ecco') or contains(sitemap:loc,'sustainability') or contains(sitemap:loc,'testimonials') or contains(sitemap:loc,'careers')]">
          <a href="{sitemap:loc}" class="card">
            <div class="card-ico">
              <xsl:choose>
                <xsl:when test="contains(sitemap:loc,'about')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></xsl:when>
                <xsl:when test="contains(sitemap:loc,'why-ecco')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></xsl:when>
                <xsl:when test="contains(sitemap:loc,'sustainability')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L7 18"/><path d="M12.73 2.27A10 10 0 0 1 21 11c-2 0-7-1-9-5l-1.34 1.34"/></svg></xsl:when>
                <xsl:when test="contains(sitemap:loc,'testimonials')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></xsl:when>
                <xsl:when test="contains(sitemap:loc,'careers')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></xsl:when>
              </xsl:choose>
            </div>
            <div class="card-body">
              <div class="card-name"><xsl:choose><xsl:when test="contains(sitemap:loc,'about')">About Us</xsl:when><xsl:when test="contains(sitemap:loc,'why-ecco')">Why Ecco</xsl:when><xsl:when test="contains(sitemap:loc,'sustainability')">Sustainability</xsl:when><xsl:when test="contains(sitemap:loc,'testimonials')">Client Testimonials</xsl:when><xsl:when test="contains(sitemap:loc,'careers')">Careers</xsl:when></xsl:choose></div>
              <div class="card-desc"><xsl:choose><xsl:when test="contains(sitemap:loc,'about')">Our story, values, and leadership team</xsl:when><xsl:when test="contains(sitemap:loc,'why-ecco')">What makes Ecco different from competitors</xsl:when><xsl:when test="contains(sitemap:loc,'sustainability')">Our eco-certified, non-toxic cleaning approach</xsl:when><xsl:when test="contains(sitemap:loc,'testimonials')">Real stories from NYC businesses we serve</xsl:when><xsl:when test="contains(sitemap:loc,'careers')">Open positions and benefits of joining our team</xsl:when></xsl:choose></div>
              <div class="card-meta"><span class="card-date"><xsl:value-of select="sitemap:lastmod"/></span><xsl:choose><xsl:when test="sitemap:priority >= 0.8"><span class="priority p-high"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:when test="sitemap:priority >= 0.5"><span class="priority p-med"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:otherwise><span class="priority p-low"><xsl:value-of select="sitemap:priority"/></span></xsl:otherwise></xsl:choose></div>
            </div>
          </a>
        </xsl:for-each>
      </div>
    </div>

    <!-- BLOG -->
    <div class="category">
      <div class="cat-label">Blog</div>
      <div class="card-grid">
        <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'blog')]">
          <a href="{sitemap:loc}" class="card">
            <div class="card-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
            <div class="card-body">
              <div class="card-name"><xsl:choose><xsl:when test="sitemap:loc='https://eccofacilities.com/blog.html'">Blog</xsl:when><xsl:when test="contains(sitemap:loc,'5-signs')">5 Signs of a Good Cleaning Company</xsl:when><xsl:when test="contains(sitemap:loc,'eco-certified')">Why Eco-Certified Cleaning Matters</xsl:when><xsl:when test="contains(sitemap:loc,'janitorial-vs')">Janitorial vs Day Porter</xsl:when></xsl:choose></div>
              <div class="card-desc"><xsl:choose><xsl:when test="sitemap:loc='https://eccofacilities.com/blog.html'">All articles, guides, and industry insights</xsl:when><xsl:when test="contains(sitemap:loc,'5-signs')">What to look for when choosing a cleaning provider</xsl:when><xsl:when test="contains(sitemap:loc,'eco-certified')">The health and environmental impact of product choices</xsl:when><xsl:when test="contains(sitemap:loc,'janitorial-vs')">Understanding which service fits your needs</xsl:when></xsl:choose></div>
              <div class="card-meta"><span class="card-date"><xsl:value-of select="sitemap:lastmod"/></span><xsl:choose><xsl:when test="sitemap:priority >= 0.8"><span class="priority p-high"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:when test="sitemap:priority >= 0.5"><span class="priority p-med"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:otherwise><span class="priority p-low"><xsl:value-of select="sitemap:priority"/></span></xsl:otherwise></xsl:choose></div>
            </div>
          </a>
        </xsl:for-each>
      </div>
    </div>

    <!-- LEGAL -->
    <div class="category">
      <div class="cat-label">Legal</div>
      <div class="card-grid">
        <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'privacy') or contains(sitemap:loc,'terms')]">
          <a href="{sitemap:loc}" class="card">
            <div class="card-ico">
              <xsl:choose>
                <xsl:when test="contains(sitemap:loc,'privacy')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></xsl:when>
                <xsl:otherwise><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></xsl:otherwise>
              </xsl:choose>
            </div>
            <div class="card-body">
              <div class="card-name"><xsl:choose><xsl:when test="contains(sitemap:loc,'privacy')">Privacy Policy</xsl:when><xsl:when test="contains(sitemap:loc,'terms')">Terms of Service</xsl:when></xsl:choose></div>
              <div class="card-desc"><xsl:choose><xsl:when test="contains(sitemap:loc,'privacy')">How we collect, use, and protect your data</xsl:when><xsl:when test="contains(sitemap:loc,'terms')">Service agreements, guarantees, and policies</xsl:when></xsl:choose></div>
              <div class="card-meta"><span class="card-date"><xsl:value-of select="sitemap:lastmod"/></span><xsl:choose><xsl:when test="sitemap:priority >= 0.8"><span class="priority p-high"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:when test="sitemap:priority >= 0.5"><span class="priority p-med"><xsl:value-of select="sitemap:priority"/></span></xsl:when><xsl:otherwise><span class="priority p-low"><xsl:value-of select="sitemap:priority"/></span></xsl:otherwise></xsl:choose></div>
            </div>
          </a>
        </xsl:for-each>
      </div>
    </div>

  </div>

  <!-- CTA -->
  <div class="cta">
    <h2>Ready to get started?</h2>
    <p>Get a free, customized proposal for your facility within 24 hours.</p>
    <a href="quote.html" class="cta-btn">Get Your Free Proposal →</a>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-links">
      <a href="index.html">Home</a>
      <a href="services.html">Services</a>
      <a href="about.html">About</a>
      <a href="privacy.html">Privacy Policy</a>
      <a href="terms.html">Terms</a>
    </div>
    <div class="footer-copy">© 2026 Ecco Facilities LLC. All rights reserved.</div>
  </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
