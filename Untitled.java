python3 << 'PYEOF'
import pathlib

f = pathlib.Path('app/api/cron/weather-refresh/route.ts')
t = f.read_text()

if "import { processTransportWeatherHolds } from '@/lib/weather/weather-processor';" not in t:
    # Find the last import line and append after it
    lines = t.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    lines.insert(last_import_idx + 1, "import { processTransportWeatherHolds } from '@/lib/weather/weather-processor';")
    t = '\n'.join(lines)
    print('✓ Added missing import to weather cron')

if "await processTransportWeatherHolds();" not in t:
    t = t.replace(
        "return NextResponse.json({ success: true,",
        "await processTransportWeatherHolds();\n\n    return NextResponse.json({ success: true,"
    )
    print('✓ Added processor call to weather cron')

f.write_text(t)
PYEOF