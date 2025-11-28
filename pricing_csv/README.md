# 📊 CSV soubory pro import do Google Sheets - Ceník Kohútka

Tento adresář obsahuje CSV soubory připravené pro import do Google Sheets.

## 📁 Přehled souborů

### Ceníky s cenami (běžná struktura)
| Soubor | Sheet v Google | Počet položek | Popis |
|--------|---------------|---------------|-------|
| `denni.csv` | DENNÍ | 14 + 3 headery | Denní jízdenky, Skiregion Valašsko, Bezkydy Card |
| `casove.csv` | ČASOVÉ | 4 položky | Časové jízdenky (3h, 4h, večerní, odpolední) |
| `sezonni.csv` | SEZÓNNÍ | 2 položky | Kohútka Skipas, Czech Skipass |
| `jednotlive.csv` | JEDNOTLIVÉ | 1 položka | Jednotlivá jízda |
| `bodove.csv` | BODOVÉ | 10 + 2 headery | Bodové jízdenky + spotřeba na vlecích |
| `ostatni.csv` | OSTATNÍ | 4 položky | Lyžařské kurzy, Skialp, Dětský park |

### Informační listy (jednoduchá struktura)
| Soubor | Sheet v Google | Počet položek | Popis |
|--------|---------------|---------------|-------|
| `informace_vekove_kategorie.csv` | INFORMACE (část 1) | 4 kategorie | Věkové kategorie (Dospělí, Děti, Junioři, Senioři) |
| `informace_dulezite.csv` | INFORMACE (část 2) | 7 položek | Důležité informace o jízdenkách |
| `slevy.csv` | SLEVY | 8 položek | Seznam slev a podmínek |

---

## 📥 Návod na import do Google Sheets

### 1️⃣ Import ceníků s cenami (DENNÍ, ČASOVÉ, SEZÓNNÍ, atd.)

**Pro každý sheet proveď:**

1. Otevři příslušný sheet v Google Spreadsheet (např. "DENNÍ")
2. **File → Import → Upload**
3. Vyber příslušný CSV soubor (např. `denni.csv`)
4. **Nastavení importu:**
   - Import location: **Replace current sheet**
   - Separator type: **Comma**
   - Convert text to numbers, dates...: **✓ Zaškrtni** (aby se ceny zobrazovaly jako čísla)
5. Klikni **Import data**

✅ **Hotovo!** Měl bys vidět:
- Sloupec A: Názvy jízdenek
- Sloupce B-E: Ceny pro věkové kategorie
- Sloupec F: Cena pro všechny (použije se místo B-E)
- Sloupec G: ANO/NE (headery)
- Sloupec H: Poznámky (zatím prázdné)

---

### 2️⃣ Import INFORMACÍ (složitější)

**Sheet "INFORMACE" má 2 části:**

#### Část 1: Věkové kategorie
1. Otevři sheet "INFORMACE"
2. Import `informace_vekove_kategorie.csv` do **řádku 1**
3. Získáš tabulku:
   ```
   Kategorie | Název    | Narození
   adult     | Dospělí  | 1961-2007
   child     | Děti     | 2015 a mladší
   ...
   ```

#### Část 2: Důležité informace
1. Ve stejném sheetu "INFORMACE"
2. Přejdi na **řádek 7** (pod věkovými kategoriemi)
3. Import `informace_dulezite.csv`
4. Získáš seznam textů (bullet pointy)

💡 **Tip:** Můžeš to udělat i ručně - prostě zkopíruj texty z CSV a vlož je pod sebe.

---

### 3️⃣ Import SLEV

1. Otevři sheet "SLEVY"
2. Import `slevy.csv`
3. Získáš jednoduchý seznam textů (8 řádků)

---

## 🎯 Výsledná struktura Google Spreadsheet

Po importu všech CSV budeš mít:

```
📊 Kohútka - Ceník 2024/2025 (Google Spreadsheet)
├── 📄 DENNÍ (14 položek + 3 headery)
├── 📄 ČASOVÉ (4 položky)
├── 📄 SEZÓNNÍ (2 položky)
├── 📄 JEDNOTLIVÉ (1 položka)
├── 📄 BODOVÉ (10 položek + 2 headery)
├── 📄 OSTATNÍ (4 položky)
├── 📄 INFORMACE (4 věkové kategorie + 7 důležitých info)
└── 📄 SLEVY (8 slev)
```

---

## ✏️ Jak upravovat ceník (pro klienta)

### Změna ceny
1. Otevři příslušný sheet (např. DENNÍ)
2. Najdi řádek s jízdenkou
3. Uprav číslo v příslušném sloupci (Dospělí, Děti, Junioři, Senioři)
4. **Ctrl+S** (uložit)
5. ✅ Změna se projeví na webu **za 1-5 minut**

### Přidání nové jízdenky
1. Přidej nový řádek
2. Vyplň:
   - **Název jízdenky:** např. "7-denní jízdenka"
   - **Ceny:** 1500, 600, 1200, 1200
   - **Je header:** NE
3. Ulož
4. ✅ Automaticky se zobrazí na webu

### Přidání nadpisu (header)
1. Přidej řádek
2. Vyplň:
   - **Název:** např. "Speciální nabídky"
   - **Je header:** ANO
   - Ostatní sloupce nech prázdné
3. ✅ Zobrazí se jako modrý nadpis

### Změna věkové kategorie
1. Otevři sheet "INFORMACE"
2. Uprav příslušný řádek (např. Dospělí: "1961-2007" → "1965-2010")
3. ✅ Změní se všude na webu

---

## 🔄 Další kroky

Po úspěšném importu všech CSV:

1. ✅ Zkontroluj, že všechny sheety vypadají správně
2. ✅ Publikuj každý sheet jako CSV (File → Share → Publish to web)
3. ✅ Zkopíruj URLs do `.env` souboru aplikace
4. ✅ Spusť aplikaci a otestuj načítání dat

---

## ❓ Časté problémy

**❌ Ceny se importují jako text místo čísel**
- ✅ Při importu zaškrtni "Convert text to numbers, dates..."

**❌ Speciální znaky (čárky, háčky) vypadají divně**
- ✅ CSV je v UTF-8, Google Sheets by měl automaticky rozpoznat

**❌ Je header ANO/NE se neimportuje správně**
- ✅ Zkontroluj, že je to v sloupci G a píše se přesně "ANO" nebo "NE"

---

Vytvořeno pro projekt **Kohútka Web** 🎿
