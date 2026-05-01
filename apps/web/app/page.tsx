"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-container">
          <div className="logo">
            <span className="logo-text">LABFORGE</span>
          </div>
          <div className="nav-links">
            <Link href="/login" className="nav-link hide-mobile">LOG IN</Link>
            <Link href="/login?mode=register" className="btn-primary-sm">GET STARTED</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content animate-fade-in">
          <div className="badge">AI LABORATORY ENGINE V2.1</div>
          <h1 className="hero-title">
            ГЕНЕРАЦИЯ <span className="text-gray">ОТЧЕТОВ</span> <br/>ПО ГОСТУ
          </h1>
          <p className="hero-subtitle">
            Профессиональный ИИ-ассистент для студентов и преподавателей. 
            Создавайте полные лабораторные работы с кодом и диаграммами за секунды.
            <br/><br/>
            <span className="info-tag">5 ГЕНЕРАЦИЙ БЕСПЛАТНО ПРИ РЕГИСТРАЦИИ</span>
          </p>
          <div className="hero-actions">
            <Link href="/login?mode=register" className="btn-primary">СОЗДАТЬ ОТЧЕТ</Link>
            <a href="#how-it-works" className="btn-secondary hide-mobile">КАК ЭТО РАБОТАЕТ?</a>
          </div>
        </div>
        
        <div className="hero-visual hide-mobile animate-slide-up">
           <div className="visual-card">
              <div className="card-header">
                 <div className="tab">GENERATOR_CORE.SH</div>
              </div>
              <div className="card-body">
                 <pre className="code-mockup">
                    <code>
{`> INITIALIZING ENGINE... [OK]
> THEME: OOP PRINCIPLES
> LANGUAGE: C# (DOTNET 8)
> GENERATING 5 TASKS...
> BUILDING MERMAID SCHEMES...
> FORMATTING DOCX (GOST 7.32)...
> REPORT READY. DOWNLOAD ATTACHED.`}
                    </code>
                 </pre>
              </div>
           </div>
        </div>
      </section>

      {/* Step by Step */}
      <section id="how-it-works" className="steps">
         <div className="section-header">
            <h2 className="section-title">4 ШАГА К ЦЕЛИ</h2>
            <p className="section-subtitle">ПРОЦЕСС ГЕНЕРАЦИИ МАКСИМАЛЬНО УПРОЩЕН</p>
         </div>
         <div className="steps-container">
            <div className="step-item">
               <div className="step-num">01</div>
               <h3>ЛОГИН</h3>
               <p>Зайдите в нашего [Telegram бота](https://t.me/LabForgebot) и установите пароль для входа на сайт.</p>
            </div>
            <div className="step-item">
               <div className="step-num">02</div>
               <h3>ТЕМА</h3>
               <p>Введите тему вашей работы и выберите язык программирования. ИИ сам подберет задания.</p>
            </div>
            <div className="step-item">
               <div className="step-num">03</div>
               <h3>КОНТРОЛЬ</h3>
               <p>Проверьте сгенерированный код и ответы на вопросы. Вы можете отредактировать любой блок.</p>
            </div>
            <div className="step-item">
               <div className="step-num">04</div>
               <h3>ФАЙЛ</h3>
               <p>Нажмите «Скачать DOCX» и получите готовый к сдаче файл со всеми скриншотами и кодом.</p>
            </div>
         </div>
      </section>

      {/* Languages */}
      <section className="languages">
         <div className="languages-inner">
            <h3>ПОДДЕРЖИВАЕМЫЕ ЯЗЫКИ</h3>
            <div className="lang-row">
               <span>C#</span>
               <span>PYTHON</span>
               <span>JAVA</span>
               <span>C++</span>
               <span>JS/TS</span>
            </div>
         </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="section-header">
          <h2 className="section-title">ПОЧЕМУ МЫ?</h2>
          <p className="section-subtitle">ПРЕИМУЩЕСТВА LABFORGE ПЕРЕД ОБЫЧНЫМ CHATGPT</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">AI</div>
            <h3>СПЕЦИАЛИЗАЦИЯ</h3>
            <p>Наши промпты оптимизированы именно под образовательные стандарты РФ.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">DI</div>
            <h3>БЛОК-СХЕМЫ</h3>
            <p>Автоматическая генерация схем Mermaid для алгоритмов любого уровня сложности.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">DOC</div>
            <h3>ОФОРМЛЕНИЕ</h3>
            <p>Больше не нужно мучиться с отступами в Word. Мы делаем это за вас.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">ST</div>
            <h3>СТИЛЬ КОДА</h3>
            <p>Код пишется в стиле «прилежного студента», чтобы не вызывать подозрений.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing">
        <div className="section-header">
           <h2 className="section-title">ТАРИФЫ</h2>
           <p className="section-subtitle">ПОДДЕРЖИТЕ РАЗРАБОТКУ СЕРВИСА</p>
        </div>
        
        <div className="pricing-grid">
           <div className="price-card">
              <div className="price-tag">NEW USER</div>
              <h3>START</h3>
              <div className="price-val">0 ₽</div>
              <ul className="price-list">
                 <li>5 ГЕНЕРАЦИЙ</li>
                 <li>БАЗОВЫЕ МОДЕЛИ</li>
                 <li>DOCX ЭКСПОРТ</li>
              </ul>
              <Link href="/login?mode=register" className="btn-secondary" style={{ width: '100%' }}>ПОПРОБОВАТЬ</Link>
           </div>
           
           <div className="price-card highlight">
              <div className="price-tag">POPULAR</div>
              <h3>PRO PACK</h3>
              <div className="price-val">150 ₽</div>
              <ul className="price-list">
                 <li>5 ГЕНЕРАЦИЙ</li>
                 <li>ПРЕМИУМ МОДЕЛИ (CLAUDE)</li>
                 <li>ПОДДЕРЖКА 24/7</li>
              </ul>
              <button 
                className="btn-primary" 
                style={{ width: '100%' }}
                onClick={() => window.open("https://t.me/vwzz1", "_blank")}
              >
                КУПИТЬ В ТГ
              </button>
           </div>

           <div className="price-card">
              <div className="price-tag">MAX VALUE</div>
              <h3>ULTRA</h3>
              <div className="price-val">300 ₽</div>
              <ul className="price-list">
                 <li>10 ГЕНЕРАЦИЙ</li>
                 <li>ЛУЧШАЯ ЦЕНА</li>
                 <li>БЕЗЛИМИТНЫЕ ПРАВКИ</li>
              </ul>
              <button 
                className="btn-secondary" 
                style={{ width: '100%' }}
                onClick={() => window.open("https://t.me/vwzz1", "_blank")}
              >
                КУПИТЬ В ТГ
              </button>
           </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
         <div className="section-header">
            <h2 className="section-title">FAQ</h2>
            <p className="section-subtitle">ОТВЕТЫ НА ЧАСТЫЕ ВОПРОСЫ</p>
         </div>
         <div className="faq-grid">
            <div className="faq-item">
               <h4>Как оплатить?</h4>
               <p>На данный момент оплата принимается вручную через администратора в Telegram для обеспечения безопасности транзакций.</p>
            </div>
            <div className="faq-item">
               <h4>Код будет работать?</h4>
               <p>Да, ИИ генерирует полностью рабочий код с комментариями. Мы рекомендуем проверять его перед сдачей.</p>
            </div>
            <div className="faq-item">
               <h4>Это анонимно?</h4>
               <p>Мы не храним ваши личные данные, только ID Telegram для синхронизации баланса.</p>
            </div>
         </div>
      </section>

      {/* Disclaimer */}
      <section className="disclaimer">
         <div className="disclaimer-content">
            <div className="disclaimer-icon">!</div>
            <div className="disclaimer-text">
               <h3>ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ</h3>
               <p>
                  LABFORGE ЯВЛЯЕТСЯ ИНСТРУМЕНТОМ АВТОМАТИЗАЦИИ УЧЕБНОГО ПРОЦЕССА. МЫ ПРИЗЫВАЕМ ИСПОЛЬЗОВАТЬ СЕРВИС 
                  КАК ПОМОЩНИКА В ОФОРМЛЕНИИ, А НЕ КАК ПОЛНУЮ ЗАМЕНУ ОБУЧЕНИЮ. АВТОРЫ НЕ НЕСУТ ОТВЕТСТВЕННОСТИ 
                  ЗА РЕЗУЛЬТАТЫ ПРОВЕРКИ РАБОТ ВАШИМИ ПРЕПОДАВАТЕЛЯМИ.
               </p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
           <div className="footer-brand">
              <div className="logo" style={{ marginBottom: 12 }}>
                <span className="logo-text">LABFORGE</span>
              </div>
              <p>ИНТЕЛЛЕКТУАЛЬНАЯ КУЗНИЦА ОБРАЗОВАНИЯ.</p>
           </div>
           <div className="footer-info">
              <p>© 2026 LABFORGE PROJECT. ALL RIGHTS RESERVED.</p>
           </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-page { background: transparent; min-height: 100vh; overflow-x: hidden; }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.8s ease-out forwards; }

        .nav { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; transition: all 0.2s; padding: 32px 0; border-bottom: 1px solid transparent; }
        .nav-scrolled { background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); padding: 16px 0; border-bottom: 1px solid #111; }
        .nav-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 32px; }
        .logo-text { font-weight: 800; letter-spacing: 0.3em; font-size: 16px; color: #fff; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link { font-size: 11px; font-weight: 700; color: #444; letter-spacing: 0.1em; transition: color 0.2s; }
        .nav-link:hover { color: #fff; }

        .hero { padding: 220px 32px 140px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .hero-title { font-size: 80px; font-weight: 900; margin-bottom: 24px; color: #fff; line-height: 1.0; letter-spacing: -0.02em; }
        .text-gray { color: #222; }
        .hero-subtitle { font-size: 18px; color: #666; margin-bottom: 48px; line-height: 1.6; max-width: 550px; text-transform: uppercase; letter-spacing: 0.05em; }
        .info-tag { font-size: 12px; color: #fff; background: #111; border: 1px solid #222; padding: 10px 20px; display: inline-block; font-weight: 800; }
        .badge { font-size: 10px; font-weight: 800; color: #333; margin-bottom: 24px; letter-spacing: 0.3em; border-left: 3px solid #fff; padding-left: 15px; }
        .hero-actions { display: flex; gap: 16px; }
        
        .btn-primary-sm { background: #fff; color: #000; padding: 12px 24px; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; }

        .visual-card { border: 1px solid #111; background: #050505; }
        .card-header { background: #000; padding: 14px 20px; border-bottom: 1px solid #111; }
        .tab { font-size: 10px; color: #222; font-family: var(--mono); font-weight: 700; }
        .card-body { padding: 40px; }
        .code-mockup { font-family: var(--mono); font-size: 14px; color: #1a1a1a; line-height: 1.8; }

        .steps, .features, .pricing, .faq, .disclaimer { padding: 140px 32px; max-width: 1200px; margin: 0 auto; border-top: 1px solid #111; }
        .section-header { margin-bottom: 100px; text-align: left; }
        .section-title { font-size: 40px; color: #fff; margin-bottom: 16px; font-weight: 900; letter-spacing: -0.01em; }
        .section-subtitle { color: #222; font-size: 12px; letter-spacing: 0.4em; font-weight: 800; }

        .steps-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; }
        .step-item { position: relative; }
        .step-num { font-size: 60px; font-weight: 900; color: #111; margin-bottom: 20px; font-family: var(--mono); }
        .step-item h3 { font-size: 18px; color: #fff; margin-bottom: 16px; font-weight: 800; letter-spacing: 0.1em; }
        .step-item p { color: #444; font-size: 14px; line-height: 1.7; }

        .languages { padding: 80px 0; border-top: 1px solid #111; border-bottom: 1px solid #111; }
        .languages-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; text-align: center; }
        .languages-inner h3 { font-size: 11px; color: #222; letter-spacing: 0.5em; margin-bottom: 40px; font-weight: 800; }
        .lang-row { display: flex; justify-content: center; gap: 60px; flex-wrap: wrap; }
        .lang-row span { font-size: 24px; font-weight: 900; color: #fff; opacity: 0.1; transition: opacity 0.3s; cursor: default; }
        .lang-row span:hover { opacity: 1; }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: #111; border: 1px solid #111; }
        .feature-card { padding: 60px; background: #000; transition: background 0.4s; }
        .feature-card:hover { background: #030303; }
        .feature-icon-wrapper { font-family: var(--mono); font-size: 14px; color: #111; margin-bottom: 30px; font-weight: 900; border-bottom: 2px solid #111; display: inline-block; }
        .feature-card h3 { font-size: 18px; margin-bottom: 20px; color: #fff; font-weight: 800; letter-spacing: 0.05em; }
        .feature-card p { color: #555; font-size: 14px; line-height: 1.7; }

        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
        .price-card { border: 1px solid #111; padding: 60px; position: relative; background: #000; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .price-card:hover { border-color: #222; transform: translateY(-15px); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .price-card.highlight { border-color: #333; }
        .price-tag { font-size: 10px; color: #333; font-weight: 900; letter-spacing: 0.3em; margin-bottom: 20px; border-bottom: 2px solid #111; padding-bottom: 10px; display: inline-block; }
        .price-card h3 { font-size: 28px; margin-bottom: 12px; font-weight: 900; }
        .price-val { font-size: 56px; font-weight: 900; margin-bottom: 40px; font-family: var(--mono); }
        .price-list { list-style: none; margin-bottom: 60px; display: flex; flex-direction: column; gap: 20px; }
        .price-list li { font-size: 13px; color: #555; font-weight: 800; letter-spacing: 0.1em; display: flex; align-items: center; gap: 15px; }
        .price-list li::before { content: "::"; color: #222; font-family: var(--mono); }

        .faq-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .faq-item h4 { font-size: 18px; color: #fff; margin-bottom: 16px; font-weight: 800; }
        .faq-item p { color: #444; font-size: 14px; line-height: 1.8; }

        .disclaimer-content { border: 1px solid #211; background: #050000; padding: 60px; display: flex; gap: 40px; align-items: flex-start; }
        .disclaimer-icon { font-size: 40px; font-weight: 900; color: #311; font-family: var(--mono); }
        .disclaimer-text h3 { font-size: 16px; color: #511; margin-bottom: 20px; font-weight: 900; letter-spacing: 0.15em; }
        .disclaimer-text p { font-size: 14px; color: #222; line-height: 2.0; font-weight: 700; }

        .footer { padding: 100px 32px; border-top: 1px solid #111; }
        .footer-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; }
        .footer-brand p { font-size: 11px; color: #222; margin-top: 12px; letter-spacing: 0.2em; font-weight: 800; }
        .footer-info p { font-size: 10px; color: #111; letter-spacing: 0.1em; font-weight: 800; }

        @media (max-width: 1024px) {
          .hero { grid-template-columns: 1fr; text-align: center; padding-top: 140px; gap: 40px; }
          .hero-subtitle { margin: 0 auto 32px; font-size: 16px; }
          .hero-actions { justify-content: center; }
          .hero-visual { display: none; }
          .hero-title { font-size: 56px; }
        }
        @media (max-width: 640px) {
          .hero-title { font-size: 38px; line-height: 1.1; }
          .hide-mobile { display: none; }
          .nav { padding: 16px 0; }
          .footer-container { flex-direction: column; gap: 40px; text-align: center; }
          .pricing-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 28px; }
          .feature-card { padding: 32px; }
          .hero { padding-top: 120px; }
        }
      `}</style>
    </div>
  );
}
