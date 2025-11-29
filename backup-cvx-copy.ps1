# backup-cvx-copy.ps1
param(
    [string]$Source = "C:\Users\JokanderX\cvx",
    [string]$DestRoot = "C:\Users\JokanderX\cvxGaurds"
)

# Timestamp
$ts = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
$DestFolder = Join-Path $DestRoot "cvx_backup_$ts"

# المجلدات التي نريد استثناؤها (node_modules فقط حسب المطلوب)
$excludeDirs = @("node_modules")

# إنشاء مجلد الوجهة
if (-not (Test-Path -Path $DestRoot)) {
    New-Item -ItemType Directory -Path $DestRoot | Out-Null
}
New-Item -ItemType Directory -Path $DestFolder | Out-Null

Write-Output "Starting backup..."
Write-Output "Source: $Source"
Write-Output "Destination: $DestFolder"

# استخدم robocopy لنسخ كل الملفات بشكل متكرر مع استثناء مجلدات node_modules
# /E = نسخ المجلدات الفرعية بما فيها الفارغة
# /COPY:DAT = نسخ Data, Attributes, Timestamps (سريع وموثوق)
# /R:2 /W:2 = محاولتين عند الفشل مع انتظار 2 ثانية
# /XD = استبعاد المجلدات بالاسم
$xdParams = $excludeDirs
$rd = @($Source, $DestFolder, '/E','/COPY:DAT','/R:2','/W:2','/NFL','/NDL') + @('/XD') + $xdParams
# تشغيل robocopy
$robocopyResult = Start-Process -FilePath robocopy -ArgumentList $rd -NoNewWindow -Wait -PassThru

# robocopy يعيد exit codes خاصة — 0-7 تعتبر نجاح أو نجاح مع تحذيرات
$exitCode = $robocopyResult.ExitCode
if ($exitCode -le 7) {
    Write-Output "Backup completed successfully. ExitCode: $exitCode"
    Write-Output "Backup folder: $DestFolder"
} else {
    Write-Error "Robocopy failed. ExitCode: $exitCode"
}
