# HalfWay

Prosty dziennik treningów: iPhone + Mac (PWA), dane synchronizowane przez Supabase.

## Jak to działa

- `index.html`, `styles.css`, `app.js` to cała aplikacja, bez kroku budowania.
- `config.js` zawiera adres projektu Supabase i klucz `anon`. Puste wartości włączają tryb lokalny, w którym dane zostają tylko w przeglądarce.
- `sw.js` (service worker) sprawia, że aplikacja otwiera się też bez internetu. Zmiany zrobione offline czekają w kolejce i wysyłają się po powrocie sieci.
- `supabase/schema.sql` zawiera tabele `sports` i `entries` oraz reguły RLS (każdy widzi tylko swoje dane).

## Uruchomienie

1. Supabase → SQL Editor → wklej `supabase/schema.sql` → Run.
2. Supabase → Authentication → URL Configuration → Site URL: `https://alieenus.github.io/halfway/`.
3. Uzupełnij `config.js`.
4. GitHub → Settings → Pages → Deploy from branch `main`, folder `/ (root)`.
5. Na iPhonie otwórz adres w Safari → Udostępnij → **Dodaj do ekranu początkowego**.
6. Na Macu: Safari → Plik → **Dodaj do Docka** (albo Chrome → Zainstaluj aplikację).

Po założeniu swojego konta warto wyłączyć rejestrację nowych użytkowników:
Supabase → Authentication → Sign In / Providers → *Allow new users to sign up* → off.

## Lokalnie

```
python3 -m http.server 8000
```
