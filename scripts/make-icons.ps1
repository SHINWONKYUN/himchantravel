Add-Type -AssemblyName System.Drawing

function New-AppIcon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $colorA = [System.Drawing.Color]::FromArgb(15, 118, 110)
    $colorB = [System.Drawing.Color]::FromArgb(20, 184, 166)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect, $colorA, $colorB, 45.0
    )

    $r = [int]($size * 0.18)
    $d = $r * 2
    $pathObj = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathObj.AddArc(0, 0, $d, $d, 180, 90)
    $pathObj.AddArc($size - $d, 0, $d, $d, 270, 90)
    $pathObj.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $pathObj.AddArc(0, $size - $d, $d, $d, 90, 90)
    $pathObj.CloseFigure()
    $g.FillPath($brush, $pathObj)

    $char = [string][char]0xD798

    $fontFamily = New-Object System.Drawing.FontFamily 'Malgun Gothic'
    $fontSize = [float]($size * 0.55)
    $fontStyle = [System.Drawing.FontStyle]::Bold
    $unit = [System.Drawing.GraphicsUnit]::Pixel
    $font = New-Object System.Drawing.Font $fontFamily, $fontSize, $fontStyle, $unit

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rx = [float]0
    $ry = [float]($size * -0.04)
    $rw = [float]$size
    $rh = [float]$size
    $textRect = New-Object System.Drawing.RectangleF $rx, $ry, $rw, $rh

    $g.DrawString($char, $font, [System.Drawing.Brushes]::White, $textRect, $sf)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $brush.Dispose()
    $font.Dispose()
    $fontFamily.Dispose()
    $pathObj.Dispose()
    $sf.Dispose()
    $bmp.Dispose()

    $info = Get-Item $path
    Write-Output ("{0}  ({1} bytes)" -f $path, $info.Length)
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $projectRoot 'public\icons'

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

New-AppIcon 192 (Join-Path $iconsDir 'icon-192.png')
New-AppIcon 512 (Join-Path $iconsDir 'icon-512.png')

Write-Output '=== ICONS GENERATED ==='
