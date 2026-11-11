import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const TEMP_BASE = path.join(os.tmpdir(), 'lealresto-android-build');
const SDK_DIR = path.join(TEMP_BASE, 'sdk');
const BUILD_DIR = path.join(TEMP_BASE, 'work');
const DIST_DIR = path.join(ROOT, 'dist');
const PUBLIC_DIR = path.join(ROOT, 'public');

const JAVA_HOME = 'C:\\Program Files\\Java\\jdk-21.0.12.1';
const JAVAC = fs.existsSync(path.join(JAVA_HOME, 'bin', 'javac.exe'))
  ? `"${path.join(JAVA_HOME, 'bin', 'javac.exe')}"`
  : 'javac';
const JAR = fs.existsSync(path.join(JAVA_HOME, 'bin', 'jar.exe'))
  ? `"${path.join(JAVA_HOME, 'bin', 'jar.exe')}"`
  : 'jar';
const KEYTOOL = fs.existsSync(path.join(JAVA_HOME, 'bin', 'keytool.exe'))
  ? `"${path.join(JAVA_HOME, 'bin', 'keytool.exe')}"`
  : 'keytool';

function getLocalLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
          return net.address;
        }
      }
    }
  }
  return '192.168.1.5';
}

async function downloadFile(url, dest) {
  console.log(`⬇️ Descargando ${path.basename(dest)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

function findFileRecursive(dir, filename) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFileRecursive(full, filename);
      if (found) return found;
    } else if (entry.name.toLowerCase() === filename.toLowerCase()) {
      return full;
    }
  }
  return null;
}

async function ensureAndroidTools() {
  fs.mkdirSync(SDK_DIR, { recursive: true });

  let aapt2 = findFileRecursive(SDK_DIR, 'aapt2.exe');
  if (!aapt2) {
    const btZip = path.join(SDK_DIR, 'build-tools.zip');
    if (!fs.existsSync(btZip)) {
      await downloadFile(
        'https://dl.google.com/android/repository/build-tools_r34-windows.zip',
        btZip
      );
    }
    console.log('📦 Extrayendo Android Build-Tools...');
    execSync(`tar -xf "${btZip}" -C "${SDK_DIR}"`, { stdio: 'inherit' });
    aapt2 = findFileRecursive(SDK_DIR, 'aapt2.exe');
  }

  let androidJar = findFileRecursive(SDK_DIR, 'android.jar');
  if (!androidJar) {
    const platZip = path.join(SDK_DIR, 'platform.zip');
    if (!fs.existsSync(platZip)) {
      const urls = [
        'https://dl.google.com/android/repository/platform-34_r01.zip',
        'https://dl.google.com/android/repository/platform-33_r02.zip',
        'https://dl.google.com/android/repository/platform-31_r01.zip',
      ];
      let downloaded = false;
      for (const u of urls) {
        try {
          await downloadFile(u, platZip);
          downloaded = true;
          break;
        } catch {
          // try next
        }
      }
      if (!downloaded) throw new Error('Could not download android platform zip');
    }
    console.log('📦 Extrayendo Android Platform...');
    execSync(`tar -xf "${platZip}" -C "${SDK_DIR}"`, { stdio: 'inherit' });
    androidJar = findFileRecursive(SDK_DIR, 'android.jar');
  }

  const btDir = path.dirname(aapt2);
  return {
    aapt2,
    zipalign: path.join(btDir, 'zipalign.exe'),
    d8Jar: path.join(btDir, 'lib', 'd8.jar'),
    apksignerJar: path.join(btDir, 'lib', 'apksigner.jar'),
    androidJar,
  };
}

function buildStandaloneHtml(lanIp) {
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find((f) => f.endsWith('.css'));
  const jsFile = files.find((f) => f.endsWith('.js'));

  const cssContent = cssFile
    ? fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8')
    : '';
  const jsContent = jsFile
    ? fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8')
    : '';

  // Escape any closing script tags inside JS bundle
  const safeJs = jsContent.replace(/<\/script>/gi, '<\\/script>');

  const publicUrl = (
    process.env.PUBLIC_SERVER_URL ||
    process.env.VITE_PUBLIC_SERVER_URL ||
    `http://${lanIp}:3000`
  ).replace(/\/+$/, '');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>Submigueleños</title>
    <style>${cssContent}</style>
    <script>
      try {
        var customUrl = localStorage.getItem('submiguelenos_server_url_v1');
        window.__LEALRESTO_SERVER_URL__ = customUrl || "${publicUrl}";
        if (!window.location.search.includes('app=android')) {
          window.history.replaceState({}, '', '?app=android');
        }
      } catch (e) {
        window.__LEALRESTO_SERVER_URL__ = "${publicUrl}";
      }
    </script>
  </head>
  <body class="bg-neutral-950 text-neutral-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
    <div id="root"></div>
    <script type="module">${safeJs}</script>
  </body>
</html>`;
}

async function main() {
  console.log('🔨 1/5 Compilando aplicación web de producción (Vite)...');
  execSync('npx vite build', { stdio: 'inherit', cwd: ROOT });

  const tools = await ensureAndroidTools();
  const JAVA_EXE = fs.existsSync(path.join(JAVA_HOME, 'bin', 'java.exe'))
    ? `"${path.join(JAVA_HOME, 'bin', 'java.exe')}"`
    : 'java';

  console.log('📱 2/5 Preparando proyecto nativo Android (com.lealresto.app)...');
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  const srcDir = path.join(BUILD_DIR, 'src', 'com', 'lealresto', 'app');
  const resDrawableDir = path.join(BUILD_DIR, 'res', 'drawable');
  const assetsDir = path.join(BUILD_DIR, 'assets');
  const classesDir = path.join(BUILD_DIR, 'classes');

  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(resDrawableDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(classesDir, { recursive: true });

  const lanIp = getLocalLanIp();
  fs.writeFileSync(
    path.join(assetsDir, 'index.html'),
    buildStandaloneHtml(lanIp),
    'utf-8'
  );

  // Adaptive Vector Icon
  const iconXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#D97706"
        android:pathData="M0,0h108v108h-108z"/>
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M56,22 C60,34 72,42 74,56 C76,68 68,80 56,86 C42,86 32,74 34,58 C36,44 48,36 56,22 Z"/>
    <path
        android:fillColor="#FBBF24"
        android:pathData="M54,64 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0"/>
</vector>`;
  fs.writeFileSync(path.join(resDrawableDir, 'ic_launcher.xml'), iconXml, 'utf-8');

  // AndroidManifest.xml
  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
    <!-- Android Manifest -->
    <manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.lealresto.app"
    android:versionCode="26"
    android:versionName="2.6.0">

    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="Submiguelenos"
        android:icon="@drawable/ic_launcher"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name="com.lealresto.app.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
  const manifestPath = path.join(BUILD_DIR, 'AndroidManifest.xml');
  fs.writeFileSync(manifestPath, manifestXml, 'utf-8');

  // MainActivity.java
  const mainActivityJava = `package com.lealresto.app;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#171717"));
        window.setNavigationBarColor(Color.parseColor("#FFFFFF"));

        webView = new WebView(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
        }
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);

        webView.loadUrl("file:///android_asset/index.html?app=android");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`;
  const mainActivityPath = path.join(srcDir, 'MainActivity.java');
  fs.writeFileSync(mainActivityPath, mainActivityJava, 'utf-8');

  console.log('⚙️ 3/5 Empaquetando recursos con AAPT2...');
  const compiledResZip = path.join(BUILD_DIR, 'compiled_res.zip');
  const unalignedApk = path.join(BUILD_DIR, 'unaligned.apk');
  const rJavaDir = path.join(BUILD_DIR, 'src');

  execSync(
    `"${tools.aapt2}" compile --dir "${path.join(BUILD_DIR, 'res')}" -o "${compiledResZip}"`,
    { stdio: 'inherit' }
  );

  execSync(
    `"${tools.aapt2}" link -o "${unalignedApk}" -I "${tools.androidJar}" --manifest "${manifestPath}" -A "${assetsDir}" --java "${rJavaDir}" "${compiledResZip}"`,
    { stdio: 'inherit' }
  );

  console.log('☕ 4/5 Compilando código Java y convirtiendo a DEX...');
  const rJavaPath = path.join(srcDir, 'R.java');
  execSync(
    `${JAVAC} --release 11 -cp "${tools.androidJar}" -d "${classesDir}" "${mainActivityPath}" "${rJavaPath}"`,
    { stdio: 'inherit' }
  );

  const classFiles = fs
    .readdirSync(path.join(classesDir, 'com', 'lealresto', 'app'))
    .filter((f) => f.endsWith('.class'))
    .map((f) => `"${path.join(classesDir, 'com', 'lealresto', 'app', f)}"`)
    .join(' ');

  execSync(
    `${JAVA_EXE} -cp "${tools.d8Jar}" com.android.tools.r8.D8 --lib "${tools.androidJar}" --output "${BUILD_DIR}" ${classFiles}`,
    { stdio: 'inherit' }
  );

  // Add classes.dex to the root of unaligned.apk
  execSync(`${JAR} -uf "${unalignedApk}" -C "${BUILD_DIR}" classes.dex`, {
    stdio: 'inherit',
  });

  console.log('🔐 5/5 Alineando y firmando LealResto.apk...');
  const alignedApk = path.join(BUILD_DIR, 'aligned.apk');
  execSync(`"${tools.zipalign}" -f -p 4 "${unalignedApk}" "${alignedApk}"`, {
    stdio: 'inherit',
  });

  const keystorePath = path.join(SDK_DIR, 'lealresto-release.keystore');
  if (!fs.existsSync(keystorePath)) {
    execSync(
      `${KEYTOOL} -genkeypair -v -keystore "${keystorePath}" -alias lealresto -keyalg RSA -keysize 2048 -validity 10000 -storepass lealresto123 -keypass lealresto123 -dname "CN=LealResto, OU=Mobile, O=LealResto, L=Bogota, S=DC, C=CO"`,
      { stdio: 'inherit' }
    );
  }

  const tempSignedApk = path.join(BUILD_DIR, 'Submiguelenos-signed.apk');

  execSync(
    `${JAVA_EXE} -jar "${tools.apksignerJar}" sign --ks "${keystorePath}" --ks-pass pass:lealresto123 --key-pass pass:lealresto123 --out "${tempSignedApk}" "${alignedApk}"`,
    { stdio: 'inherit' }
  );

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const finalPublicApk = path.join(PUBLIC_DIR, 'Submiguelenos.apk');
  const finalDistApk = path.join(DIST_DIR, 'Submiguelenos.apk');
  const finalRootApk = path.join(ROOT, 'Submiguelenos.apk');
  const aliasPublicApk = path.join(PUBLIC_DIR, 'LealResto.apk');
  const aliasDistApk = path.join(DIST_DIR, 'LealResto.apk');

  fs.copyFileSync(tempSignedApk, finalPublicApk);
  fs.copyFileSync(tempSignedApk, finalDistApk);
  fs.copyFileSync(tempSignedApk, finalRootApk);
  fs.copyFileSync(tempSignedApk, aliasPublicApk);
  fs.copyFileSync(tempSignedApk, aliasDistApk);

  const sizeKb = Math.round(fs.statSync(finalPublicApk).size / 1024);
  console.log(`\n✅ APK NATIVO SUBMIGUELEÑOS GENERADO Y FIRMADO CON ÉXITO (${sizeKb} KB):`);
  console.log(`   👉 ${finalRootApk}`);
  console.log(`   👉 ${finalPublicApk}\n`);
}

main().catch((err) => {
  console.error('❌ Error generando APK:', err);
  process.exit(1);
});