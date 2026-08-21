param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $ProjectRoot 'images/items/gameplay/phantom-raven-gameplay.png'
$outputPath = Join-Path $ProjectRoot 'images/og.png'

$canvas = [System.Drawing.Bitmap]::new(1200, 630, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Full-bleed, real in-game capture. No generated illustration or invented game UI.
$source = [System.Drawing.Image]::FromFile($sourcePath)
$destination = [System.Drawing.Rectangle]::new(0, 0, 1200, 630)
$sourceHeight = [int]($source.Width / ($destination.Width / $destination.Height))
$sourceY = [Math]::Max(0, [int](($source.Height - $sourceHeight) * 0.34))
$sourceCrop = [System.Drawing.Rectangle]::new(0, $sourceY, $source.Width, $sourceHeight)
$graphics.DrawImage($source, $destination, $sourceCrop, [System.Drawing.GraphicsUnit]::Pixel)

# One simple title field. The gradient preserves the game scene instead of framing it.
$shade = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(42, 3, 8, 14))
$graphics.FillRectangle($shade, 0, 0, 1200, 630)

$solidPanel = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(226, 4, 10, 17))
$graphics.FillRectangle($solidPanel, 0, 0, 430, 630)

$panelRect = [System.Drawing.Rectangle]::new(430, 0, 470, 630)
$panelBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $panelRect,
    [System.Drawing.Color]::FromArgb(226, 4, 10, 17),
    [System.Drawing.Color]::FromArgb(0, 4, 10, 17),
    [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal
)
$graphics.FillRectangle($panelBrush, $panelRect)

$cyan = [System.Drawing.Color]::FromArgb(96, 211, 238)
$white = [System.Drawing.Color]::FromArgb(248, 250, 252)
$muted = [System.Drawing.Color]::FromArgb(188, 201, 211)
$cyanBrush = [System.Drawing.SolidBrush]::new($cyan)
$whiteBrush = [System.Drawing.SolidBrush]::new($white)
$mutedBrush = [System.Drawing.SolidBrush]::new($muted)

$eyebrowFont = [System.Drawing.Font]::new('Segoe UI Semibold', 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$titleFont = [System.Drawing.Font]::new('Bahnschrift SemiBold SemiConden', 84, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$categoryFont = [System.Drawing.Font]::new('Segoe UI Semibold', 20, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$domainFont = [System.Drawing.Font]::new('Segoe UI Semibold', 15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$graphics.FillRectangle($cyanBrush, 72, 65, 38, 4)
$graphics.DrawString('PSOBB  /  DESTINY SERVER', $eyebrowFont, $mutedBrush, 128, 53)

$graphics.DrawString('DESTINY', $titleFont, $whiteBrush, 65, 130)
$graphics.DrawString('GUIDE', $titleFont, $whiteBrush, 65, 217)

$graphics.FillRectangle($cyanBrush, 72, 340, 74, 5)
$graphics.DrawString('BEGINNER  ·  ITEMS  ·  RAIDS', $categoryFont, $whiteBrush, 70, 377)

$rulePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(90, 166, 190, 205), 1)
$graphics.DrawLine($rulePen, 72, 535, 415, 535)
$graphics.DrawString('ANGRIETA.GITHUB.IO', $domainFont, $cyanBrush, 70, 558)

# A thin edge is enough to keep the crop clean in KakaoTalk's white card.
$edgePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(120, 96, 211, 238), 2)
$graphics.DrawRectangle($edgePen, 1, 1, 1197, 627)

$edgePen.Dispose()
$rulePen.Dispose()
$domainFont.Dispose()
$categoryFont.Dispose()
$titleFont.Dispose()
$eyebrowFont.Dispose()
$mutedBrush.Dispose()
$whiteBrush.Dispose()
$cyanBrush.Dispose()
$panelBrush.Dispose()
$solidPanel.Dispose()
$shade.Dispose()
$source.Dispose()
$graphics.Dispose()
$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()

Write-Output $outputPath
