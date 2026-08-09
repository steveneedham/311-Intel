/**
 * Pileup Detection & Analysis Dashboard
 * Displays vehicle clustering events and enables map navigation
 */

export class PileupDashboard {
  constructor(appState) {
    this.appState = appState;
    this.pileupData = null;
    this.filteredPileups = [];
    this.sortBy = 'vehicle_count'; // 'vehicle_count', 'active', 'recent'
  }

  async loadPileupData() {
    try {
      const response = await fetch('pileup-analysis.json');
      this.pileupData = await response.json();
      this.filteredPileups = [...(this.pileupData.all_pileups || [])];
      this.updatePileupDisplay();
      this.updateMetrics();
      return this.pileupData;
    } catch (error) {
      console.error('Error loading pileup data:', error);
      return null;
    }
  }

  updateMetrics() {
    const summary = this.pileupData?.summary || {};
    const metricsEl = document.getElementById('pileupMetrics');
    if (metricsEl) {
      metricsEl.innerHTML = `
        <div class="metric-card">
          <div class="metric-value">${summary.active_pileup_count || 0}</div>
          <div class="metric-label">Active pileups</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${summary.total_vehicles_in_pileups || 0}</div>
          <div class="metric-label">Vehicles stacked</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${summary.avg_vehicles_per_pileup || 0}</div>
          <div class="metric-label">Avg cluster size</div>
        </div>
      `;
    }

    const countEl = document.getElementById('pileupCount');
    if (countEl) {
      countEl.textContent = `${this.filteredPileups.length} total`;
    }
  }

  sortPileups(sortBy) {
    this.sortBy = sortBy;
    const pileups = [...this.filteredPileups];

    switch (sortBy) {
      case 'vehicle_count':
        pileups.sort((a, b) => (b.vehicle_count || 0) - (a.vehicle_count || 0));
        break;
      case 'active':
        pileups.sort((a, b) => {
          if (a.active === b.active) return 0;
          return a.active ? -1 : 1;
        });
        break;
      case 'recent':
        pileups.sort((a, b) => {
          const aDate = new Date(a.last_seen_at || a.first_detected_at || 0);
          const bDate = new Date(b.last_seen_at || b.first_detected_at || 0);
          return bDate - aDate;
        });
        break;
    }

    this.filteredPileups = pileups;
    this.updatePileupDisplay();
  }

  updatePileupDisplay() {
    const pileupList = document.getElementById('pileupList');
    if (!pileupList) return;

    if (this.filteredPileups.length === 0) {
      pileupList.innerHTML = '<p class="empty-state">No pileups detected</p>';
      return;
    }

    pileupList.innerHTML = `
      <div class="sort-controls">
        <button class="sort-btn ${this.sortBy === 'vehicle_count' ? 'active' : ''}"
                data-sort="vehicle_count">Largest</button>
        <button class="sort-btn ${this.sortBy === 'active' ? 'active' : ''}"
                data-sort="active">Active</button>
        <button class="sort-btn ${this.sortBy === 'recent' ? 'active' : ''}"
                data-sort="recent">Recent</button>
      </div>
      <div class="pileup-items">
        ${this.filteredPileups.slice(0, 20).map(p => this.renderPileupItem(p)).join('')}
      </div>
    `;

    // Add event listeners to sort buttons
    pileupList.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sortPileups(btn.dataset.sort);
      });
    });

    // Add event listeners to pileup items
    pileupList.querySelectorAll('.pileup-item').forEach(item => {
      const coordinateLink = item.querySelector('.coordinate-link');

      // Handle coordinate link clicks separately
      if (coordinateLink) {
        coordinateLink.addEventListener('click', (e) => {
          e.stopPropagation();
          const lat = parseFloat(coordinateLink.dataset.lat);
          const lng = parseFloat(coordinateLink.dataset.lng);
          const mapTab = document.querySelector('[data-view="map"]');
          if (mapTab) {
            mapTab.click();
            setTimeout(() => {
              const event = new CustomEvent('centerOnLocation', {
                detail: { lat, lng }
              });
              document.dispatchEvent(event);
            }, 100);
          }
        });
      }

      // Handle pileup item clicks to navigate to pileup
      item.addEventListener('click', () => {
        const pileupId = item.dataset.pileupId;
        this.navigateToPileup(pileupId);
      });
    });
  }

  renderPileupItem(pileup) {
    const statusBadge = pileup.active ? 'ACTIVE' : 'REVIEW';
    const firstDetected = new Date(pileup.first_detected_at);
    const lastSeen = pileup.active ? 'Now' : new Date(pileup.last_seen_at).toLocaleString();
    const companies = (pileup.companies || []).join(', ') || 'Unknown';
    const companyCount = (pileup.companies || []).length;

    return `
      <div class="pileup-item" data-pileup-id="${pileup.id}" role="button" tabindex="0">
        <div style="border-left: 4px solid #a85628; padding: 12px; background: #f9f7f5;">
          <div style="color: #a85628; font-weight: 600; font-size: 15px; margin-bottom: 4px;">${pileup.id}</div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 600; font-size: 16px;">${pileup.vehicle_count || 0} vehicles</span>
            <span style="color: #666;"> · ${companyCount} operator${companyCount !== 1 ? 's' : ''}</span>
          </div>
          <div style="color: #666; font-size: 14px; margin-bottom: 8px;">${companies}</div>
          <div style="color: #666; font-size: 14px; margin-bottom: 8px;">
            <button class="coordinate-link" data-lat="${pileup.lat}" data-lng="${pileup.lng}" style="background: none; border: none; color: #0066cc; text-decoration: underline; cursor: pointer; font-family: inherit; padding: 0; font-size: 14px;">
              ${pileup.lat.toFixed(5)}, ${pileup.lng.toFixed(5)}
            </button>
          </div>
          <div style="display: inline-block; background: #e8d4c4; color: #a85628; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: 600; margin-bottom: 8px; margin-right: 8px;">${statusBadge}</div>
          <div style="color: #666; font-size: 13px; line-height: 1.5;">
            First observed ${firstDetected.toLocaleDateString()} ${firstDetected.toLocaleTimeString()} · Last observed ${lastSeen} · seen in ${pileup.snapshot_count || 0} snapshot${(pileup.snapshot_count || 0) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    `;
  }

  navigateToPileup(pileupId) {
    const pileup = this.pileupData.all_pileups.find(p => p.id === pileupId);
    if (!pileup) return;

    // Store the target pileup in app state
    this.appState.selectedPileup = {
      id: pileupId,
      lat: pileup.lat,
      lng: pileup.lng,
      vehicleCount: pileup.vehicle_count,
      companies: pileup.companies,
    };

    // Navigate to map view
    const mapTab = document.querySelector('[data-view="map"]');
    if (mapTab) {
      mapTab.click();

      // Scroll to center on pileup
      setTimeout(() => {
        this.centerMapOnPileup(pileup.lat, pileup.lng);
      }, 100);
    }
  }

  centerMapOnPileup(lat, lng) {
    const event = new CustomEvent('pileupSelected', {
      detail: { lat, lng }
    });
    document.dispatchEvent(event);
  }

  filterByStatus(active) {
    this.filteredPileups = (this.pileupData.all_pileups || []).filter(
      p => p.active === active
    );
    this.updatePileupDisplay();
    this.updateMetrics();
  }

  filterByCompany(company) {
    this.filteredPileups = (this.pileupData.all_pileups || []).filter(
      p => (p.companies || []).includes(company)
    );
    this.updatePileupDisplay();
    this.updateMetrics();
  }
}
