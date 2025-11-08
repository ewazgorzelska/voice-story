# Plan implementacji widoku Biblioteka Opowiadań

## 1. Przegląd
Widok "Biblioteka Opowiadań" jest głównym interfejsem, w którym zalogowani użytkownicy mogą przeglądać listę dostępnych opowiadań do wygenerowania w wersji audio przy użyciu ich sklonowanego głosu. Widok będzie prezentował historie w formie siatki interaktywnych kart i zawierał mechanizm paginacji do nawigacji po większej liczbie opowiadań.

## 2. Routing widoku
Widok powinien być dostępny pod następującą ścieżką:
- `/stories`

Dostęp do tej ścieżki powinien być chroniony i wymagać zalogowania użytkownika.

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w React i osadzone jako interaktywna wyspa na stronie Astro. Poniżej przedstawiono hierarchię komponentów:

```
src/pages/stories.astro
└── src/components/views/StoryLibraryView.tsx (React Island)
    ├── h1 (Tytuł strony, np. "Biblioteka Opowiadań")
    ├── StoryGrid.tsx
    │   ├── SkeletonCard.tsx (wyświetlany podczas ładowania danych)
    │   └── StoryCard.tsx (renderowany dla każdej historii)
    │       ├── CardHeader (z obrazkiem/miniaturką)
    │       └── CardFooter (z tytułem i przyciskiem akcji)
    └── StoryPagination.tsx
        └── Pagination (komponent z biblioteki Shadcn/UI)
```

## 4. Szczegóły komponentów

### `StoryLibraryView.tsx` (Komponent kontenerowy)
- **Opis komponentu**: Główny komponent widoku, odpowiedzialny za zarządzanie stanem, pobieranie danych z API oraz koordynację renderowania komponentów podrzędnych.
- **Główne elementy**: Tytuł strony (`<h1>`), komponenty `StoryGrid` oraz `StoryPagination`.
- **Obsługiwane interakcje**: Reaguje na zmianę strony w komponencie `StoryPagination` w celu pobrania nowej partii danych.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `StoryLibraryViewModel`, `StorySummaryDto`, `PaginationMetaDto`.
- **Propsy**: Brak.

### `StoryGrid.tsx`
- **Opis komponentu**: Komponent prezentacyjny, który renderuje siatkę historii (`StoryCard`) lub szkieletów (`SkeletonCard`) w zależności od stanu ładowania.
- **Główne elementy**: Kontener siatki (np. `div` ze stylami `grid` z Tailwind CSS), mapowanie po liście historii lub liście szkieletów.
- **Obsługiwane interakcje**: Brak; przekazuje zdarzenia kliknięcia z `StoryCard`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `StorySummaryDto[]`.
- **Propsy**:
  - `stories: StorySummaryDto[]`: Tablica historii do wyświetlenia.
  - `isLoading: boolean`: Flaga informująca, czy dane są w trakcie ładowania.
  - `pageSize: number`: Liczba elementów na stronie (potrzebna do renderowania odpowiedniej liczby szkieletów).

### `StoryCard.tsx`
- **Opis komponentu**: Wyświetla informacje o pojedynczej historii w formie karty. Karta jest klikalna i powinna nawigować do strony szczegółów lub generowania historii.
- **Główne elementy**: Komponent `Card` z Shadcn/UI, zawierający `CardHeader` (z obrazkiem) i `CardFooter` (z tytułem i przyciskiem `Button`).
- **Obsługiwane interakcje**: `onClick` na całej karcie lub na przycisku, co powoduje nawigację do strony szczegółów historii (np. `/stories/{slug}`).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `StorySummaryDto`.
- **Propsy**:
  - `story: StorySummaryDto`: Obiekt z danymi historii.

### `StoryPagination.tsx`
- **Opis komponentu**: Renderuje kontrolki paginacji na podstawie metadanych otrzymanych z API. Umożliwia użytkownikowi nawigację między stronami.
- **Główne elementy**: Komponent `Pagination` z Shadcn/UI (`Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationLink`, `PaginationNext`).
- **Obsługiwane interakcje**: `onPageChange` - zdarzenie emitowane po kliknięciu na numer strony, przycisk "wstecz" lub "dalej".
- **Obsługiwana walidacja**:
  - Przycisk "Wstecz" jest nieaktywny, jeśli użytkownik jest na pierwszej stronie.
  - Przycisk "Dalej" jest nieaktywny, jeśli użytkownik jest na ostatniej stronie.
- **Typy**: `PaginationMetaDto`.
- **Propsy**:
  - `pagination: PaginationMetaDto`: Metadane paginacji z API.
  - `onPageChange: (page: number) => void`: Funkcja zwrotna wywoływana przy zmianie strony.

## 5. Typy
Do implementacji widoku wymagane będą istniejące typy DTO oraz nowy typ ViewModel.

- **`StorySummaryDto`** (DTO z `src/types.ts`):
  ```typescript
  export type StorySummaryDto = {
    id: string;
    title: string;
    slug: string;
  };
  ```

- **`PaginationMetaDto`** (DTO z `src/types.ts`):
  ```typescript
  export interface PaginationMetaDto {
    page: number;
    page_size: number;
    total: number;
  }
  ```

- **`GetStoriesResponseDto`** (DTO z `src/types.ts`):
  ```typescript
  export interface GetStoriesResponseDto {
    data: StorySummaryDto[];
    meta: PaginationMetaDto;
  }
  ```

- **`StoryLibraryViewModel`** (Nowy typ ViewModel):
  Główny obiekt stanu dla widoku, zarządzany w `StoryLibraryView`.
  - `stories: StorySummaryDto[]`: Lista historii dla bieżącej strony.
  - `pagination: PaginationMetaDto | null`: Metadane paginacji.
  - `isLoading: boolean`: Flaga informująca o stanie ładowania danych.
  - `error: string | null`: Przechowuje komunikaty o błędach.
  - `currentPage: number`: Aktualnie wybrany numer strony.

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie `StoryLibraryView.tsx` przy użyciu hooków `useState` i `useEffect`. Zaleca się stworzenie niestandardowego hooka `useStoryLibrary`, aby zamknąć w nim logikę pobierania danych i zarządzania stanem, co uczyni komponent widoku czystszym.

- **`useStoryLibrary` hook**:
  - **Cel**: Abstrakcja logiki pobierania danych, obsługi stanu ładowania, błędów i paginacji.
  - **Parametry**: `{ initialPage: number, pageSize: number }`.
  - **Zwracane wartości**: `{ stories, pagination, isLoading, error, setCurrentPage }`.
  - **Logika wewnętrzna**: Używa `useEffect` do wywołania API przy zmianie `currentPage`. Zarządza stanem za pomocą `useState`.

## 7. Integracja API
Komponent będzie komunikował się z backendem za pomocą jednego endpointu:

- **Endpoint**: `GET /api/stories`
- **Parametry zapytania**:
  - `page: number` - numer strony
  - `pageSize: number` - liczba wyników na stronę
  - `sort: 'asc' | 'desc'` - kierunek sortowania (domyślnie 'asc')
- **Typ odpowiedzi (sukces)**: `GetStoriesResponseDto`
- **Akcja**:
  1. Ustaw `isLoading` na `true`.
  2. Wykonaj zapytanie `fetch` do `/api/stories`.
  3. Po otrzymaniu odpowiedzi:
     - Zaktualizuj stany `stories` i `pagination`.
     - Ustaw `isLoading` na `false`.
  4. W przypadku błędu:
     - Ustaw stan `error` z komunikatem.
     - Ustaw `isLoading` na `false`.

## 8. Interakcje użytkownika
- **Wejście na stronę**:
  - Użytkownik nawiguje do `/stories`.
  - Wyświetlany jest komponent `SkeletonCard` w siatce.
  - Wywoływane jest API w celu pobrania pierwszej strony historii.
  - Po załadowaniu danych siatka jest wypełniana komponentami `StoryCard`, a paginacja jest renderowana.
- **Zmiana strony**:
  - Użytkownik klika na numer strony lub przycisk nawigacyjny w paginacji.
  - Wywoływana jest funkcja `onPageChange` z nowym numerem strony.
  - Aktualizowany jest stan `currentPage`, co ponownie uruchamia proces pobierania danych dla nowej strony.
- **Wybór opowiadania**:
  - Użytkownik klika na `StoryCard`.
  - Aplikacja nawiguje do strony szczegółów opowiadania, używając `slug` (np. `/stories/the-little-red-hood`).

## 9. Warunki i walidacja
- **Paginacja**:
  - Przycisk "Wstecz" (`PaginationPrevious`) jest nieaktywny, gdy `pagination.page === 1`.
  - Przycisk "Dalej" (`PaginationNext`) jest nieaktywny, gdy `pagination.page * pagination.page_size >= pagination.total`.
- **Dostęp**: Widok jest dostępny tylko dla zalogowanych użytkowników. Niezalogowany użytkownik powinien być przekierowany na stronę logowania.

## 10. Obsługa błędów
- **Błąd API (np. status 500)**:
  - Hook `useStoryLibrary` powinien przechwycić błąd.
  - Stan `error` zostanie ustawiony.
  - W interfejsie użytkownika zostanie wyświetlony komunikat o błędzie (np. za pomocą komponentu `Alert` z Shadcn/UI), informujący o problemie z załadowaniem historii.
- **Brak wyników**:
  - Jeśli API zwróci pustą tablicę `data`, zamiast siatki powinien zostać wyświetlony komunikat "Nie znaleziono żadnych opowiadań".
- **Błąd autoryzacji (np. status 401/403)**:
  - Globalny mechanizm obsługi zapytań `fetch` powinien przechwycić błąd i przekierować użytkownika na stronę logowania.

## 11. Kroki implementacji
1. **Utworzenie pliku strony Astro**: Stwórz plik `src/pages/stories.astro`. Wewnątrz zaimportuj i wyrenderuj komponent `StoryLibraryView`, używając dyrektywy `client:load`.
2. **Implementacja komponentu `StoryLibraryView.tsx`**: Stwórz główny komponent kontenerowy, który będzie zarządzał stanem widoku.
3. **Stworzenie hooka `useStoryLibrary.ts`**: Zaimplementuj logikę pobierania danych i zarządzania stanem w dedykowanym hooku.
4. **Implementacja komponentów prezentacyjnych**: Stwórz komponenty `StoryGrid.tsx`, `StoryCard.tsx` i `StoryPagination.tsx` zgodnie z opisem.
5. **Stworzenie komponentu `SkeletonCard.tsx`**: Zaimplementuj szkielet ładowania, który wizualnie odpowiada strukturze `StoryCard`, używając komponentu `Skeleton` z Shadcn/UI.
6. **Styling**: Użyj Tailwind CSS do ostylowania siatki i pozostałych elementów, aby zapewnić spójny wygląd z resztą aplikacji.
7. **Nawigacja**: Zaimplementuj logikę nawigacji po kliknięciu na `StoryCard`, kierując użytkownika do dynamicznej ścieżki opartej na `slug` opowiadania.
8. **Testowanie**: Przetestuj działanie paginacji, obsługę stanu ładowania oraz scenariusze błędów (brak wyników, błąd serwera).
