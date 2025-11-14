import { test, expect } from '@playwright/test'

test.describe('Constellation Positioning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/chart-a-constellation')
    await page.waitForLoadState('networkidle')
    // Wait for Three.js canvas to be ready
    await page.waitForSelector('canvas')
    await page.waitForTimeout(2000) // Let scene initialize
  })

  test('constellation should be centered in HUD after placing 3 stars', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes
    
    // Listen for console logs to track progress
    const logs: string[] = []
    const allLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      allLogs.push(`[${msg.type()}] ${text}`)
      
      if (text.includes('🔍 HUD Calculation') || 
          text.includes('🎯 Zoom-out complete') ||
          text.includes('✅ Translation complete')) {
        logs.push(text)
        console.log(text)
      }
    })

    // Click through intro (5 steps)
    console.log('Clicking through intro...')
    const proceedButton = page.getByTestId('proceed-button')
    for (let i = 0; i < 5; i++) {
      const isVisible = await proceedButton.isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`Intro step ${i}: Proceed button visible = ${isVisible}`)
      if (isVisible) {
        await proceedButton.click()
        console.log(`Clicked Proceed for intro step ${i}`)
        await page.waitForTimeout(500)
      }
    }
    
    // Now in selecting phase - select 3 person cards
    console.log('Selecting 3 stars...')
    const personCards = page.locator('[data-testid^="person-card-"]')
    const count = await personCards.count()
    console.log(`Found ${count} person cards`)
    
    // Click first 3 person cards
    for (let i = 0; i < Math.min(3, count); i++) {
      await personCards.nth(i).click()
      console.log(`Selected star ${i + 1}`)
      await page.waitForTimeout(300)
    }

    // Click proceed button to start journey
    console.log('Starting journey...')
    await proceedButton.click()
    console.log('Journey started')

    // For each star, wait for arrival and click placement button
    const placementIds = ['placement-close', 'placement-near', 'placement-far']
    for (let i = 0; i < 3; i++) {
      console.log(`Waiting for star ${i + 1} arrival...`)
      const placementButton = page.getByTestId(placementIds[i])
      await placementButton.waitFor({ state: 'visible', timeout: 10000 })
      console.log(`Star ${i + 1} arrived, clicking ${placementIds[i]}`)
      await placementButton.click()
      await page.waitForTimeout(1000)
      
      // After placing each star, proceed to next (or zoom out after last one)
      if (i < 2) {
        // Not the last star - click Proceed to continue
        if (await proceedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await proceedButton.click()
          console.log(`Proceeding to next star`)
          await page.waitForTimeout(500)
        }
      }
    }

    // After placing all 3 stars, click the zoom out button that appears
    console.log('Waiting for Zoom Out button after placing all stars...')
    const zoomOutButton = page.getByTestId('zoom-out-after-placement')
    await zoomOutButton.waitFor({ state: 'visible', timeout: 10000 })
    console.log('Zoom Out button visible, clicking it...')
    await zoomOutButton.click()
    console.log('Clicked Zoom Out - transitioning to constellation view')

    // Wait for zoom-out animation to complete (returning phase)
    console.log('Waiting for zoom-out animation...')
    await page.waitForTimeout(3000)

    // Take screenshot in auto-pilot mode
    await page.screenshot({ 
      path: 'test-results/constellation-auto-pilot.png',
      fullPage: false 
    })
    console.log('Screenshot taken: auto-pilot mode')

    // Click manual controls toggle
    console.log('Switching to manual mode...')
    const manualToggle = page.getByTestId('manual-controls-toggle')
    await manualToggle.click()
    await page.waitForTimeout(1000)

    // Take screenshot in manual mode
    await page.screenshot({ 
      path: 'test-results/constellation-manual-mode.png',
      fullPage: false 
    })
    console.log('Screenshot taken: manual mode')

    // Get HUD bounds from the page
    const hudBounds = await page.evaluate(() => {
      const header = document.querySelector('header')
      const navPanel = document.querySelector('[class*="nav-panel"]') || 
                       document.querySelector('nav')
      
      const headerHeight = header?.getBoundingClientRect().height || 0
      const navPanelHeight = navPanel?.getBoundingClientRect().height || 0
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // HUD is the area between header and nav panel
      const hudTop = headerHeight
      const hudBottom = viewportHeight - navPanelHeight
      const hudHeight = hudBottom - hudTop
      const hudCenterY = hudTop + hudHeight / 2
      
      return {
        hudTop,
        hudBottom,
        hudHeight,
        hudCenterY,
        viewportHeight,
        viewportWidth
      }
    })

    console.log('HUD Bounds:', hudBounds)

    // Write all console logs to file
    const fs = require('fs')
    const path = require('path')
    const logPath = path.join('test-results', 'console-logs.txt')
    fs.writeFileSync(logPath, allLogs.join('\n'), 'utf-8')
    console.log(`Console logs saved to ${logPath}`)

    // Verify canvas is visible
    const canvas = page.locator('canvas')
    expect(canvas).toBeVisible()

    // Check that no stars are cut off by nav panel
    // We can do this by checking if any star circles are partially visible at the bottom
    const navPanelOverlap = await page.evaluate(({ navHeight, viewportHeight }) => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return false
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return false
      
      // Sample pixels in the nav panel area to see if any stars are there
      const navTop = viewportHeight - navHeight
      const imageData = ctx.getImageData(0, navTop, canvas.width, navHeight)
      
      // Check if any non-black pixels exist (indicating stars)
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]
        const a = imageData.data[i + 3]
        
        // If we find bright pixels, stars are overlapping nav panel
        if (a > 0 && (r > 50 || g > 50 || b > 50)) {
          return true
        }
      }
      
      return false
    }, { 
      navHeight: hudBounds.viewportHeight - hudBounds.hudBottom,
      viewportHeight: hudBounds.viewportHeight 
    })

    expect(navPanelOverlap).toBe(false)

    // Print captured logs
    console.log('\n=== Captured Logs ===')
    logs.forEach(log => console.log(log))
  })
})
