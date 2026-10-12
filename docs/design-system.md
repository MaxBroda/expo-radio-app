# WELLE 7 — Design-System & Umsetzungsvorlage

Companion-App für einen Radiosender. Kein Streaming-Client, sondern **Rückkanal in Echtzeit**:
Hörer:innen bewerten laufend, die Moderation sieht das sofort und kann reagieren.

Dieses Dokument ist die verbindliche Vorlage für die Code-Umsetzung. Alle Werte sind final
abgestimmt und entsprechen dem Prototyp sowie dem Theme-Board im Design-Canvas.

Stand: 10.10.2026 · Hochschulprojekt, vertikaler Prototyp · Sprache der Oberfläche: Deutsch

---

## 1. Produkt in einem Absatz

Sender **WELLE 7**, Claim **„Immer eine Welle voraus."** Urbaner Musiksender mit
Nachtschiene-Anmutung. Zwei Rollen teilen sich eine App, umschaltbar über einen als Demo
gekennzeichneten Rollenschalter (kein echtes Login — bewusste Annahme des Prototyps).

| Rolle      | Sieht                                         |
| ---------- | --------------------------------------------- |
| Hörer:in   | Jetzt läuft · Verlauf · Bewerten · Songwunsch |
| Moderation | Studio: Überblick · Live-Ticker · Wunschliste |

**Was der Prototyp beweisen muss:** Eine Bewertung, die auf dem Hörerscreen abgesendet wird,
taucht sichtbar im Moderations-Ticker auf, verändert das Stimmungsbarometer und die
Verlaufskurve. Das ist der Kern der Aufgabenstellung.

---

## 2. Plattform

- React Native / Expo, **mobile only, portrait**
- Primärziel Android, iOS gleichwertig gestaltet
- Referenzgröße: **390 × 844 pt** (iPhone 14/15, Pixel 7 nahe dran)
- Dark Mode ist **primär**, Light Mode vollständig über dieselben Tokens
- Kein Desktop-, kein Tablet-Layout

---

## 3. Design-Prinzipien

1. **Zwei Dichten, ein System.** Hörerseite ruhig und großflächig — das Cover trägt die
   Fläche. Studioseite dicht und im Sekundentakt scanbar. Der Kontrast ist gewollt und wird
   über Spacing und Schriftgrade erzeugt, nicht über eine zweite Palette.
2. **Magenta ist Aktion.** Genau ein Signalton für alles Tippbare und für die Marke.
   Lavendel und Korall sind Datenfarben, nie Buttons.
3. **Farbe trägt nie allein.** Jeder Bewertungswert steht als Zahl daneben („2/5",
   „4,1 von 5"). Statusfarben kommen immer mit Label oder Icon.
4. **Kein Zustand ohne Antwort.** Jeder Screen kennt lädt · normal · leer · Fehler · gesperrt.
   Verbindungsverlust zeigt den letzten Stand mit Zeitstempel, nie eine leere Fläche.
5. **Echte Elemente.** Buttons sind Buttons, Eingaben haben Labels. Gilt auch dort, wo etwas
   nur wie ein Button aussieht.

---

## 4. Farbtokens

### 4.1 Dark (primär)

| Token              | Hex       | Verwendung                                    |
| ------------------ | --------- | --------------------------------------------- |
| `bg.base`          | `#0E0A14` | Grund der Hörerseite                          |
| `bg.studio`        | `#0A0710` | Grund der Moderationsseite, eine Stufe tiefer |
| `surface`          | `#19131F` | Karten, Eingabefelder, Sheets                 |
| `surface.sunken`   | `#140E1A` | Karten auf Studio-Grund                       |
| `surface.raised`   | `#201828` | ausgewählte Karte, aktiver Zustand            |
| `line`             | `#2E2538` | Rahmen, Trennlinien                           |
| `line.strong`      | `#3A3246` | Rahmen sekundärer Buttons                     |
| `text`             | `#F6F3F8` | Fließtext, Überschriften                      |
| `text.secondary`   | `#CFC6D6` | Interpret, Zitate, Fließtext zweiter Ordnung  |
| `text.muted`       | `#9C93A8` | Meta, Labels, Uhrzeiten                       |
| `text.disabled`    | `#6E667C` | gesperrte Elemente, Platzhalter               |
| `accent`           | `#FF3D7F` | Aktion, Marke, aktiver Tab, Fortschritt       |
| `accent.ink`       | `#1A0610` | Text auf `accent`                             |
| `accent.surface`   | `#2A1020` | Hervorhebung, neuer Ticker-Eintrag            |
| `accent.border`    | `#6B2545` | Rahmen hervorgehobener Flächen                |
| `accent.text`      | `#FFA8C6` | Text auf `accent.surface`                     |
| `data`             | `#9B7BFF` | Studio-Zahlen, gute Werte                     |
| `data.surface`     | `#1C1630` | Fläche für gute Werte                         |
| `data.border`      | `#4A3A7A` | Rahmen dazu                                   |
| `data.text`        | `#C6B4FF` | Text auf `data.surface`                       |
| `critical`         | `#FF9E8E` | Fehler, Warnung                               |
| `critical.surface` | `#2A1714` | Fläche für Fehler und schlechte Werte         |
| `critical.border`  | `#7A3A30` | Rahmen dazu                                   |
| `critical.text`    | `#FFB5A6` | Text auf `critical.surface`                   |

### 4.2 Light

| Token              | Hex       | Verwendung                                                   |
| ------------------ | --------- | ------------------------------------------------------------ |
| `bg.base`          | `#F7F5F9` | Grund der Hörerseite                                         |
| `bg.studio`        | `#EFEBF2` | Grund der Moderationsseite                                   |
| `surface`          | `#FFFFFF` | Karten, Eingabefelder                                        |
| `surface.sunken`   | `#F1EDF5` | Karten auf Studio-Grund                                      |
| `surface.raised`   | `#FCE7F0` | ausgewählte Karte                                            |
| `line`             | `#DED7E4` | Rahmen, Trennlinien                                          |
| `line.strong`      | `#C8BFD2` | Rahmen sekundärer Buttons                                    |
| `text`             | `#15101C` | Fließtext                                                    |
| `text.secondary`   | `#3E3648` | zweite Ordnung                                               |
| `text.muted`       | `#5E5569` | Meta, Labels                                                 |
| `text.disabled`    | `#8C8397` | gesperrt                                                     |
| `accent`           | `#C2185B` | Aktion, Marke — abgedunkelt, damit Weiß darauf lesbar bleibt |
| `accent.ink`       | `#FFFFFF` | Text auf `accent`                                            |
| `accent.surface`   | `#FCE7F0` | Hervorhebung                                                 |
| `accent.border`    | `#F0B9D2` | Rahmen dazu                                                  |
| `accent.text`      | `#8E1348` | Text auf `accent.surface`                                    |
| `data`             | `#5B35C7` | Studio-Zahlen, gute Werte                                    |
| `data.surface`     | `#EDE7FB` | Fläche dazu                                                  |
| `data.border`      | `#C4B2F2` | Rahmen dazu                                                  |
| `data.text`        | `#3F1F9B` | Text dazu                                                    |
| `critical`         | `#B33B2A` | Fehler, schlechte Werte                                      |
| `critical.surface` | `#FBE8E4` | Fläche dazu                                                  |
| `critical.border`  | `#E8B5AA` | Rahmen dazu                                                  |
| `critical.text`    | `#8E2A1C` | Text dazu                                                    |

### 4.3 Als Code

```ts
// theme/colors.ts
export const dark = {
  bg: { base: '#0E0A14', studio: '#0A0710' },
  surface: { default: '#19131F', sunken: '#140E1A', raised: '#201828' },
  line: { default: '#2E2538', strong: '#3A3246' },
  text: { default: '#F6F3F8', secondary: '#CFC6D6', muted: '#9C93A8', disabled: '#6E667C' },
  accent: {
    base: '#FF3D7F',
    ink: '#1A0610',
    surface: '#2A1020',
    border: '#6B2545',
    text: '#FFA8C6',
  },
  data: { base: '#9B7BFF', surface: '#1C1630', border: '#4A3A7A', text: '#C6B4FF' },
  critical: { base: '#FF9E8E', surface: '#2A1714', border: '#7A3A30', text: '#FFB5A6' },
  scale: { low: '#FF8172', mid: '#6E667C', high: '#9B7BFF' },
} as const;

export const light = {
  bg: { base: '#F7F5F9', studio: '#EFEBF2' },
  surface: { default: '#FFFFFF', sunken: '#F1EDF5', raised: '#FCE7F0' },
  line: { default: '#DED7E4', strong: '#C8BFD2' },
  text: { default: '#15101C', secondary: '#3E3648', muted: '#5E5569', disabled: '#8C8397' },
  accent: {
    base: '#C2185B',
    ink: '#FFFFFF',
    surface: '#FCE7F0',
    border: '#F0B9D2',
    text: '#8E1348',
  },
  data: { base: '#5B35C7', surface: '#EDE7FB', border: '#C4B2F2', text: '#3F1F9B' },
  critical: { base: '#B33B2A', surface: '#FBE8E4', border: '#E8B5AA', text: '#8E2A1C' },
  scale: { low: '#B33B2A', mid: '#6B6377', high: '#5B35C7' },
} as const;

export type Theme = typeof dark;
```

Zugriff im Code ausschließlich über Tokens, nie über rohe Hex-Werte in Komponenten.

---

## 5. Bewertungsskala

Divergierend, drei Stufen, Korall ↔ Neutralgrau ↔ Lavendel. Die Stufen trennen sich in
**Farbton und Helligkeit**; die Paarungen wurden gegen Protanopie, Deuteranopie und
Tritanopie geprüft (ΔE ≥ 14 im schlechtesten Paar, Kontrast gegen den Grund ≥ 3:1).

| Wert  | Token        | Dark      | Light     | Wo                     |
| ----- | ------------ | --------- | --------- | ---------------------- |
| 4 – 5 | `scale.high` | `#9B7BFF` | `#5B35C7` | Balken, Ø-Punkt, Badge |
| 3     | `scale.mid`  | `#6E667C` | `#6B6377` | Balken, Ø-Punkt, Badge |
| 1 – 2 | `scale.low`  | `#FF8172` | `#B33B2A` | Balken, Ø-Punkt, Badge |

**Regel:** Der Zahlenwert steht immer sichtbar daneben. Die Skala wird nie zyklisch erweitert
und nie für etwas anderes als Bewertungen verwendet.

Badge-Flächen (Ticker, Verlauf) nutzen die zugehörigen `surface` / `border` / `text`-Tripel:
hoch → `data.*`, mittel → `surface.sunken` + `line.strong` + `text.secondary`,
niedrig → `critical.*`.

---

## 6. Typografie

Zwei Familien, beide über Google Fonts bzw. `expo-font` eingebunden.

- **Archivo** — alles Sprachliche. Gewichte 400, 500, 600, 700.
- **IBM Plex Mono** — Zeit, Laufzeit, Durchschnitt, Stimmenzahl, Zähler. Gewichte 400, 500.
  Grund: Zahlen stehen damit in jeder Listenzeile an derselben Stelle, das macht den
  Studio-Screen scanbar.

Fallback: `system-ui` bzw. `ui-monospace`.

| Stufe       | Größe / Gewicht | Zeilenhöhe | Letterspacing     | Verwendung                  |
| ----------- | --------------- | ---------- | ----------------- | --------------------------- |
| Display     | 26 / 700        | 1.12       | −0.01em           | Songtitel auf „Jetzt läuft" |
| Title       | 22 / 700        | 1.2        | −0.01em           | Screen-Überschrift          |
| Headline    | 17 / 600        | 1.3        | 0                 | Modal-Titel, Kartentitel    |
| Body        | 15 / 400        | 1.45       | 0                 | Fließtext, Eingaben         |
| Body strong | 15 / 600        | 1.2        | 0                 | Listenzeilen-Titel          |
| Label       | 13 / 500        | 1.35       | 0                 | sekundäre Zeilen            |
| Caption     | 11–12 / 400     | 1.5        | 0                 | Meta, Hinweise              |
| Overline    | 12 / 600        | 1.3        | 0.08em, uppercase | Abschnittsüberschriften     |
| Mono        | 11–14 / 500     | 1          | 0.02–0.08em       | Zeit, Werte, Zähler         |
| Wortmarke   | 15 / 700        | 1          | 0.16em            | „WELLE 7"                   |

---

## 7. Maße

### Spacing-Skala

`4 · 8 · 12 · 16 · 20 · 24 · 32`

| Wert | Verwendung                                   |
| ---- | -------------------------------------------- |
| 4    | Icon zu Label                                |
| 8    | Chips, Buttonreihe                           |
| 12   | Karten-Innenabstand, Abstand zwischen Karten |
| 16   | horizontaler Screen-Rand **Studio**          |
| 20   | horizontaler Screen-Rand **Hörer**           |
| 24   | Abstand zwischen Abschnitten                 |
| 32   | Blockabstand                                 |

Weitere feste Maße: Listenzeile 9 px vertikal · Tab-Leiste 8 px oben, 16 px unten (Safe Area)
· Sheet-Radius oben 20 px.

### Radius

`7` (Thumbnail) · `10` (kleine Karte, Button im Studio) · `12` (Standard: Karte, Button,
Eingabe) · `14` (Rollenkarte) · `999` (Pill, Avatar, Fortschrittsbalken)

### Touch

Mindestens **44 × 44 pt** für alles Tippbare — Sterne, Tabs, Listenzeilen, Studio-Aktionen,
Icon-Buttons. Primärer Button 52 pt hoch, sekundärer 44–48 pt.

### Fläche und Tiefe

Keine Schatten. Hierarchie entsteht über Flächenhelligkeit und 1 px Rahmen.
`bg → surface → surface.raised`, Rahmen immer `line`, bei Auswahl `accent`.

---

## 8. Icons

Inline-SVG, Strichstärke **1.6** (Navigation) bzw. **1.8–2.0** (Aktion), `stroke-linecap:
round`, Farbe immer `currentColor`. Größen: 21 px Tab, 19 px Status, 16–18 px inline,
11–13 px in Badges. **Keine Emoji.** Icon-only-Buttons tragen `aria-label` bzw.
`accessibilityLabel`.

Verwendete Symbole: Broadcast-Wellen (Jetzt läuft), Liste (Verlauf), Kreis mit Plus (Wunsch),
Tacho (Überblick), Sprechblase (Ticker), Lupe (Suche), Stern (Bewertung), Schloss (gesperrt),
Uhr (Fenster/Zeit), Ausrufezeichen im Kreis (Fehler), Haken (Erfolg), Kreispfeil (erneut
verbinden), Doppelpfeil (Rollenwechsel).

---

## 9. Komponenten

### Button

| Variante      | Höhe | Fläche                            | Text                 | Rahmen                 |
| ------------- | ---- | --------------------------------- | -------------------- | ---------------------- |
| primär        | 52   | `accent`                          | `accent.ink`, 16/600 | —                      |
| sekundär      | 52   | transparent                       | `text`, 16/600       | 1 px `line.strong`     |
| kompakt       | 44   | transparent                       | `text`, 12–13/600    | 1 px `line.strong`     |
| Studio-Aktion | 44   | `accent` / transparent            | 13/600               | — / 1 px `line.strong` |
| gesperrt      | 52   | `surface.raised`-dunkel `#1E1826` | `text.disabled`      | —                      |

Radius durchgehend 12 (Studio-Aktionen 10).

### Pill / Chip

Höhe 26–36, Radius 999, Padding 0 9–13 px. Inaktiv: transparent + 1 px `line`, Text
`text.muted`. Aktiv: `accent.surface` + 1 px `accent`, Text `accent.text`.

### Sterne-Rating

Fünf Buttons à 56 × 56, Radius 12, Abstand 6. Inaktiv `surface` + `line`, aktiv
`accent.surface` + `accent.border`, Stern gefüllt `accent`. Darunter eine Zeile
„3 von 5 · geht so" in `accent.text`. `accessibilityLabel` je Stern: „n von 5 Sternen",
`accessibilityState={{ selected }}`.

Wortskala: 1 gar nicht · 2 naja · 3 geht so · 4 gut · 5 top

### Score-Badge

Pill mit Stern-Icon 11 px und Mono-Wert „2/5". Flächen nach Bewertungsskala (§5).

### Auswahlkarte (Einfachauswahl)

Volle Breite minus 32, Radius 12, Padding 10/13, Abstand 8. **Immer sichtbarer Rahmen:**
nicht gewählt `surface.sunken` + 1 px `line`; gewählt `surface.raised` + 1 px `accent`.
Keine sichtbaren Radio-Punkte. Semantik: `role="radiogroup"` / Container mit
`accessibilityRole="radiogroup"`, Karten mit `accessibilityRole="radio"` und
`accessibilityState={{ checked }}`.

### Eingabe

Höhe 48 (Suche) bzw. mehrzeilig, Radius 12, Fläche `surface`, 1 px `line`, bei Fokus bzw.
Inhalt 1 px `accent`. Textfeld immer mit sichtbarem `<label>`; bei der Suche ist das Label
visuell versteckt, aber vorhanden. Zeichenzähler rechtsbündig in Mono 11.

### Statusmeldung

Zeile aus Icon 19 px + Titel 14/600 + Text 13/400. Fehler → `critical.*`,
Hinweis → `surface` + `line.strong` + `text.secondary`, Erfolg → `data.*`.
`accessibilityLiveRegion` bzw. `role="alert"` bei Fehlern, `role="status"` sonst.

### Skeleton

Flächen in `surface` / `#1E1826`, Radius 4–8, keine Animation nötig. Container trägt
`accessibilityState={{ busy: true }}`.

### Tab-Leiste

Drei Einträge, je `flex: 1`, mindestens 44 hoch, Icon 21 + Label 11/500. Aktiv `accent`,
inaktiv `text.muted`. Oben 1 px `line`, Fläche `#120D18` (Hörer) bzw. `#100B16` (Studio).
Badge am Ticker-Tab: Pill 16 px, `accent` mit `accent.ink`, Mono 10.

### Sparkline (Stimmungsverlauf)

18 Balken, `flex: 1`, Abstand 2, Radius `4 4 0 0`, Höhe `10 + wert × 7.4`. Farbe nach
Bewertungsskala. Eigene, neu eingetroffene Werte volle Deckkraft, Bestand 0.55. Darunter
eine Legende mit den drei Stufen. Achsenzeilen in Mono 10, `text.disabled`.

---

## 10. Screens

### Hörer:in

**1 · Jetzt läuft** (Start)
Kopfzeile Wortmarke + Live-Pill mit Uhrzeit. Cover 282 × 282 zentriert, Radius 14. Titel
(Display), Interpret, „Album · Jahr" in Mono. Fortschrittsbalken 4 px mit verstrichener und
Gesamtzeit. Sendungskarte: Avatar 40, Sendungsname, „Moderation · bis HH:MM", rechts
kompakter Button „bewerten". Unten zwei Buttons: „Playlist bewerten" (primär),
„Song wünschen" (sekundär).
_Kein Play-Button im MVP._ Der Platz zwischen Fortschritt und Aktionen ist dafür
freigehalten — die Audio-Ausbaustufe kann dort ohne Umbau einsetzen.
Zustände: lädt · normal · Verbindung weg.

**2 · Wiedergabeverlauf**
Liste der letzten ~20 Titel: Thumbnail 48, Titel, Interpret, rechts Score-Badge (falls
bewertet) und Uhrzeit in Mono. Jede Zeile tippbar → Bewerten.
Zustände: lädt (Skeleton) · Liste · leer.

**3 · Playlist bewerten** (modal, gestapelt)
Zurück-Pfeil + Titel. Bezugskarte mit Cover, Titel, Interpret, Laufzeitangabe. Sterne,
Kommentarfeld (optional, 240 Zeichen), Hinweis auf den Studio-Ticker. Absenden fixiert unten.
Zustände: leer · ausgefüllt · sendet · Erfolg · Fehler · **bereits bewertet** (gesperrt mit
Begründung, Button wird zu „Zurück").

**4 · Moderation bewerten**
Gleiche Mechanik, Bezug ist die Sendung: Avatar, Name, Sendungstitel, Sendezeit, Hinweis auf
das Bewertungsfenster.
Zusatzzustand: **außerhalb des Fensters** — Erklärung plus Karte „Jetzt auf Sendung" mit der
laufenden Sendung.

**5 · Songwunsch** — alles auf einem Screen
Suchfeld über den Katalog, darunter entweder Vorschläge („Oft gewünscht heute") oder Treffer
oder, wenn nichts passt, die Eingabe selbst als auswählbare Freitext-Karte. **Auswählen,
nicht absenden.** Darunter das optionale Grußfeld. Fest am unteren Rand: Zeile „Gewählt: …"
und ein einziger Button „Wunsch absenden", inaktiv solange nichts markiert ist.
Freitext und Gruß sind getrennte Felder und werden beide übertragen.
Zustände: Startzustand mit Vorschlägen · tippt · Treffer · keine Treffer · abgeschickt ·
**Kontingent erschöpft** (max. 3 Wünsche pro Stunde; Suche deaktiviert, Button gesperrt,
Hinweis auf die Freigabe zur vollen Stunde).

**6 · Rollenschalter** — Sheet von unten, kein eigener Screen
Sichtbar als Demo gekennzeichnet. Zwei Rollenkarten als Einfachauswahl, darunter im Prototyp
zusätzlich die Zustands-Schalter.

### Moderation — Studio

Eigene Tab-Leiste, erreichbar nur über den Rollenschalter. Durchgehender Kopf: Wortmarke +
„Studio" + Demo-Chip, darunter eine kompakte Zeile mit laufendem Titel, Sendung und Restzeit.

**Überblick**
Stimmungsbarometer: gleitender Durchschnitt der letzten 15 Minuten als Hero-Zahl in Mono 38,
Trendpfeil mit Delta, Verlaufskurve mit Legende, Fußzeile mit Zeitspanne und Anzahl.
Darunter vier Kennzahl-Kacheln (Ø Titel, Ø Moderation, Bewertungen heute, offene Wünsche) —
Zahlen in Textfarbe, ein kleiner farbiger Punkt trägt die Wertung.
Dann „Zuletzt eingegangen" (zwei Einträge + Sprung in den Ticker) und „Top-Wunsch"
(Karte mit Aktionen + Sprung in die Liste).

**Ticker**
Lastanzeige (ruhig / Ansturm mit Zähler), Filter-Chips Alle / Titel / Moderation mit Anzahl,
dann die Einträge, neueste oben: Score-Badge, Bezugs-Chip, „neu"-Marke, Uhrzeit, Kommentar,
Bezugszeile. Neue Einträge mit `accent.surface` und `accent.border` hervorgehoben.

**Wünsche**
Statuszeile (offen / übernommen / abgelehnt mit Zählern), Sortierung meistgewünscht / neu,
dann die Karten: Stimmenzahl in Mono, Titel, Quelle, Gruß in `data.text` als eigene Zeile,
Status-Badge, bei offenen Wünschen die Aktionen „übernehmen" / „ablehnen". Übernommene Karten
färben sich auf `accent.surface`.

Zustände des Studios: ruhig · Ansturm · keine Verbindung (Barometer eingefroren mit
Zeitstempel, Aktionen gesperrt, „Erneut verbinden").

---

## 11. Navigation

```
Hörer:in (Tabs)                 Moderation (Tabs)
├─ Jetzt läuft                  ├─ Überblick
├─ Verlauf                      ├─ Ticker
└─ Wunsch                       └─ Wünsche

Modal / gestapelt über den Hörer-Tabs:
├─ Playlist bewerten → Erfolg
├─ Moderation bewerten → Erfolg
└─ Wunsch abgeschickt

Sheet über allem:
└─ Rollenschalter (Demo)
```

Bewerten-Screens sind modal und bekommen **keinen** eigenen Tab. Der Rollenwechsel ist
ausschließlich im Demo-Sheet erreichbar und nie eine Aktion im Hörerfluss — eine
Erfolgsmeldung bietet „Fertig", nicht „ins Studio wechseln".

---

## 12. Datenmodell

```ts
type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  durationSec?: number;
  coverUrl?: string; // im Prototyp: generierter Platzhalter
};

type Show = {
  id: string;
  title: string; // „Feierabendwelle"
  hostName: string; // „Lena Osterkamp"
  hostPhotoUrl?: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
};

type Rating = {
  id: string;
  score: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string; // ISO
  subject: { kind: 'track'; trackId: string } | { kind: 'show'; showId: string };
};

type WishStatus = 'offen' | 'übernommen' | 'abgelehnt';

type Wish = {
  id: string;
  // entweder ein Katalogtreffer …
  trackId?: string;
  // … oder eine Beschreibung in eigenen Worten
  description?: string;
  greeting?: string; // unabhängig von description, beide können gesetzt sein
  createdAt: string;
  votes: number;
  status: WishStatus;
};
```

**Wichtig:** `description` und `greeting` sind getrennte Felder. Ein Freitext-Wunsch mit Gruß
überträgt beides; die Studio-Karte zeigt die Beschreibung als Quellzeile und den Gruß als
eigene Zeile in `data.text`.

### Regeln

- Eine Bewertung pro Track und Gerät; danach ist der Screen gesperrt und zeigt die eigene
  Wertung.
- Eine Bewertung pro Sendung, nur während der Sendezeit.
- Maximal 3 Wünsche pro Stunde und Gerät; Abstimmen auf fremde Wünsche bleibt frei.
- Stimmungsbarometer: arithmetisches Mittel der Bewertungen der letzten 15 Minuten.
  Trend = Mittel der jüngeren Hälfte minus Mittel der älteren Hälfte des Fensters, als
  „flach" dargestellt bei |Δ| < 0,15.

---

## 13. Zustandsmatrix

| Screen              | lädt |     leer     |     Fehler      |      gesperrt      |       offline       |
| ------------------- | :--: | :----------: | :-------------: | :----------------: | :-----------------: |
| Jetzt läuft         |  ✓   |      —       |        —        |         —          |  ✓ (Stale-Hinweis)  |
| Verlauf             |  ✓   |      ✓       |        —        |         —          |          —          |
| Playlist bewerten   |  —   |      ✓       |        ✓        | ✓ bereits bewertet |          —          |
| Moderation bewerten |  —   |      ✓       |        ✓        |    ✓ Fenster zu    |          —          |
| Songwunsch          |  —   | ✓ Vorschläge | ✓ keine Treffer |    ✓ Kontingent    |          —          |
| Studio Überblick    |  —   |      —       |        —        |         —          |    ✓ eingefroren    |
| Studio Ticker       |  —   |      ✓       |        —        |         —          |          ✓          |
| Studio Wünsche      |  —   |      ✓       |        —        |         —          | ✓ Aktionen gesperrt |

---

## 14. Barrierefreiheit

- Kontrast **AA**: Fließtext ≥ 4,5:1, Text ab 24 px ≥ 3:1, Nicht-Text-Elemente ≥ 3:1.
  Alle Tokens oben sind gegen ihre vorgesehenen Flächen geprüft.
- Touch-Ziele ≥ 44 × 44 pt, auch in der dichten Studio-Ansicht.
- Sterne-Rating nicht nur über Farbe lesbar: Zahl plus Wortstufe stehen daneben, jeder Stern
  trägt ein eigenes Label.
- Farben, die unterschieden werden müssen, unterscheiden sich auch in Helligkeit.
  Keine Rot-Grün-Paarungen.
- Listenzeilen, Auswahlkarten und Tabs sind fokussierbare Steuerelemente mit Rolle und
  Zustand, keine getippten Container.
- Statusmeldungen werden als Live-Region angekündigt.
- Dynamische Schriftgrößen: Layouts müssen bis etwa 130 % Textskalierung ohne Abschneiden
  funktionieren; feste Höhen nur bei Buttons und Tabs.

---

## 15. Mock-Daten

Zeitstand des Prototyps: **Donnerstag 18:42**, Sendung „Feierabendwelle" (18:00 – 20:00) mit
Lena Osterkamp. Alle Uhrzeiten in Verlauf, Ticker und Wunschliste sind dazu konsistent.

Sendeplan: 06:00 Welle am Morgen (Jana Brettschneider) · 10:00 Tagwerk (Timo Harms) ·
14:00 Nachmittagswelle (Mirko Falk) · 18:00 Feierabendwelle (Lena Osterkamp) ·
20:00 Nachtschicht (Nuri Yildiz)

Laufender Titel: „Nordlicht" — Halbmond Kollektiv, Album „Spätsommerkanal", 2024, 3:52.

Kommentare sind kurz und umgangssprachlich, gemischt positiv und kritisch — etwa „bisschen
lahm der Übergang", „perfekt für den Feierabend", „schon wieder der Song, 3x diese Woche",
„Lena ist die beste". Diese Tonalität ist Teil der Gestaltung: die Kartenhöhen sind darauf
ausgelegt, dass Kommentare ein bis zwei Zeilen lang sind.

Cover und Moderationsfotos sind **bewusst geometrische Platzhalter** (getönte Fläche plus
versetzter Kreis in einer Akzentfarbe), nicht erfundene Albumgrafiken. Sie tragen
`accessibilityLabel` mit dem Zusatz „(Platzhalter)".

---

## 16. Hinweise zur Umsetzung

- **Tokens zuerst.** `theme/colors.ts`, `theme/typography.ts`, `theme/spacing.ts`, dazu ein
  `ThemeProvider` mit `useColorScheme()`. Keine Hex-Werte in Screens.
- **Schriften** über `expo-font` laden, Rendering erst nach `fontsLoaded` freigeben, sonst
  springt das Layout.
- **Safe Area** über `react-native-safe-area-context`. Die 16 px unter der Tab-Leiste sind
  zusätzlich zum Inset gedacht, nicht statt.
- **Listen** mit `FlatList`, `keyExtractor` auf die fachliche ID, Skeleton als
  `ListEmptyComponent` solange `isLoading`.
- **Kein Fake-Chrome.** Keine gezeichnete Statusleiste, keine gemalte Tastatur.
- **Navigation** mit React Navigation: zwei Tab-Navigatoren, darüber ein Stack für die
  modalen Bewerten-Screens, das Rollen-Sheet als eigenes Modal mit
  `presentation: 'transparentModal'`.
- **Rollenumschaltung** als globaler Zustand (Context oder Zustand/Redux), nicht als
  Navigationsparameter — beide Rollen arbeiten auf demselben Datenstand, das ist der Kern
  des Nachweises.
- **Echtzeit** später über WebSocket oder Polling; im Prototyp genügt ein gemeinsamer Store,
  in den die Hörerseite schreibt und den die Studioseite liest.
- **Light Mode** nicht als automatische Invertierung bauen. Die Light-Tokens sind eigene
  Werte; insbesondere ist der Akzent abgedunkelt, damit Text darauf lesbar bleibt.

---

## 17. Explizit nicht gebaut

Login und Registrierung, Profilverwaltung, Einstellungen über den Rollenschalter hinaus,
Onboarding-Strecke, Player-Steuerung, Push-Berechtigungsdialoge, Streaming fremder Sender.
