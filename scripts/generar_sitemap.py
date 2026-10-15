import os
import json
import urllib.request
import xml.etree.ElementTree as ET

BASE_URL = "https://mirabelgrano.com.ar"

PAGINAS = [
    "/",
    "/turismo.html",
    "/como-llegar.html",
    "/eventos.html",
    "/farmacias.html",
    "/telefonos.html",
]

supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
supabase_key = os.environ["SUPABASE_KEY"]

urls = [BASE_URL + pagina for pagina in PAGINAS]

offset = 0
limite = 1000

while True:
    endpoint = (
        f"{supabase_url}/rest/v1/comercios"
        f"?select=slug&estado=eq.activo"
        f"&slug=not.is.null&order=id.asc"
        f"&limit={limite}&offset={offset}"
    )

    solicitud = urllib.request.Request(
        endpoint,
        headers={
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
        },
    )

    with urllib.request.urlopen(solicitud, timeout=30) as respuesta:
        comercios = json.load(respuesta)

    for comercio in comercios:
        slug = comercio.get("slug")
        if slug:
            from urllib.parse import quote
            urls.append(
                f"{BASE_URL}/comercio.html?slug={quote(slug, safe='')}"
            )

    if len(comercios) < limite:
        break

    offset += limite

ET.register_namespace(
    "", "http://www.sitemaps.org/schemas/sitemap/0.9"
)

raiz = ET.Element(
    "{http://www.sitemaps.org/schemas/sitemap/0.9}urlset"
)

for direccion in dict.fromkeys(urls):
    elemento = ET.SubElement(
        raiz, "{http://www.sitemaps.org/schemas/sitemap/0.9}url"
    )
    ET.SubElement(
        elemento, "{http://www.sitemaps.org/schemas/sitemap/0.9}loc"
    ).text = direccion

arbol = ET.ElementTree(raiz)

ET.indent(arbol, space="  ")

arbol.write(
    "sitemap.xml",
    encoding="utf-8",
    xml_declaration=True,
)

print(f"Sitemap generado con {len(set(urls))} direcciones.")