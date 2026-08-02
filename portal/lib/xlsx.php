<?php
/**
 * A small read-only .xlsx reader.
 *
 * An .xlsx is a zip of XML, and PHP ships with ZipArchive and SimpleXML, so
 * reading one needs no library — which matters on shared hosting where we
 * cannot install anything. Only what the price-list import needs is handled:
 * the first worksheet, cell values, and shared strings.
 */

declare(strict_types=1);

/**
 * Reads the first worksheet as [rowNumber => [columnLetter => value]].
 *
 * Blank cells are omitted rather than returned empty, because the price lists
 * are read structurally — "a row with text but no price is a heading" — and
 * that test is far clearer against a sparse array.
 */
function xlsx_rows(string $path, ?array &$styles = null): array
{
    $styles = [];
    if (!is_file($path)) {
        throw new RuntimeException('Spreadsheet not found.');
    }

    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        throw new RuntimeException('That file is not a readable .xlsx workbook.');
    }

    try {
        $shared = xlsx_shared_strings($zip);

        // The first sheet by document order, which is what the price lists use.
        $sheetPath = 'xl/worksheets/sheet1.xml';
        if ($zip->locateName($sheetPath) === false) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if ($name !== false && str_starts_with($name, 'xl/worksheets/sheet')) {
                    $sheetPath = $name;
                    break;
                }
            }
        }

        $xml = $zip->getFromName($sheetPath);
        if ($xml === false) {
            throw new RuntimeException('The workbook has no readable worksheet.');
        }

        $sheet = new SimpleXMLElement($xml);
        $rows = [];

        foreach ($sheet->sheetData->row as $row) {
            $number = (int) $row['r'];
            $cells = [];

            foreach ($row->c as $cell) {
                $ref = (string) $cell['r'];
                if (!preg_match('/^([A-Z]+)/', $ref, $m)) {
                    continue;
                }
                $column = $m[1];
                $type = (string) $cell['t'];

                if ($type === 'inlineStr') {
                    $value = trim((string) $cell->is->t);
                } elseif ($type === 's') {
                    $index = (int) $cell->v;
                    $value = $shared[$index] ?? '';
                } else {
                    $value = trim((string) $cell->v);
                }

                if ($value !== '') {
                    $cells[$column] = $value;
                    // The style index is kept because the price lists mark a
                    // heading's level by formatting alone; the importer uses it
                    // to corroborate structure it would otherwise have to guess.
                    $styles[$number][$column] = (string) $cell['s'];
                }
            }

            if ($cells) {
                $rows[$number] = $cells;
            }
        }

        ksort($rows);
        return $rows;
    } finally {
        $zip->close();
    }
}

/** The workbook's shared string table, indexed as the cells reference it. */
function xlsx_shared_strings(ZipArchive $zip): array
{
    $xml = $zip->getFromName('xl/sharedStrings.xml');
    if ($xml === false) {
        return [];
    }

    $strings = [];
    foreach ((new SimpleXMLElement($xml))->si as $si) {
        // A string may be split across runs when part of it is styled, so the
        // pieces are concatenated rather than taking the first.
        $text = '';
        foreach ($si->xpath('.//*[local-name()="t"]') ?: [] as $t) {
            $text .= (string) $t;
        }
        $strings[] = trim($text);
    }
    return $strings;
}
