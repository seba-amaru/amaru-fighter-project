Add-Type -AssemblyName System.Drawing
$src = "C:\Users\bizar\.gemini\antigravity\brain\81ded0b9-e672-4eb2-b417-0e274778183c\favicon_amaru_original_style_1772686165683.png"
$img = [System.Drawing.Image]::FromFile($src)

$b1 = New-Object System.Drawing.Bitmap(192, 192)
$g1 = [System.Drawing.Graphics]::FromImage($b1)
$g1.DrawImage($img, 0, 0, 192, 192)
$b1.Save("C:\Users\bizar\OneDrive\Documentos\prueba automatizacion\app\images\icon-192.png")

$b2 = New-Object System.Drawing.Bitmap(512, 512)
$g2 = [System.Drawing.Graphics]::FromImage($b2)
$g2.DrawImage($img, 0, 0, 512, 512)
$b2.Save("C:\Users\bizar\OneDrive\Documentos\prueba automatizacion\app\images\icon-512.png")

$b3 = New-Object System.Drawing.Bitmap(192, 192)
$g3 = [System.Drawing.Graphics]::FromImage($b3)
$g3.DrawImage($img, 0, 0, 192, 192)
$b3.Save("C:\Users\bizar\OneDrive\Documentos\prueba automatizacion\images\icon-192.png")

$b4 = New-Object System.Drawing.Bitmap(512, 512)
$g4 = [System.Drawing.Graphics]::FromImage($b4)
$g4.DrawImage($img, 0, 0, 512, 512)
$b4.Save("C:\Users\bizar\OneDrive\Documentos\prueba automatizacion\images\icon-512.png")

$img.Dispose()
$b1.Dispose()
$b2.Dispose()
$b3.Dispose()
$b4.Dispose()
$g1.Dispose()
$g2.Dispose()
$g3.Dispose()
$g4.Dispose()
