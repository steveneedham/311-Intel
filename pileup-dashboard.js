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
      item.addEventListener('click', () => {
        const pileupId = item.dataset.pileupId;
        this.navigateToPileup(pileupId);
      });
    });
  }

  renderPileupItem(pileup) {
    const status = pileup.active ? 'Active' : 'Resolved';
    const statusClass = pileup.active ? 'active' : 'resolved';
    const firstDetected = new Date(pileup.first_detected_at);
    const lastSeen = pileup.active ? 'Now' : new Date(pileup.last_seen_at).toLocaleDateString();
    const companies = (pileup.companies || []).join(' + ') || 'Unknown';

    return `
      <div class="pileup-item" data-pileup-id="${pileup.id}" role="button" tabindex="0">
        <div class="pileup-header">
          <div class="pileup-id">${pileup.id}</div>
          <div class="pileup-status ${statusClass}">${status}</div>
        </div>
        <div class="pileup-details">
          <div class="detail-row">
            <span class="label">Vehicles:</span>
            <span class="value">${pileup.vehicle_count || 0}</span>
          </div>
          <div class="detail-row">
            <span class="label">Operators:</span>
            <span class="value">${companies}</span>
          </div>
          <div class="detail-row">
            <span class="label">First detected:</span>
            <span class="value">${firstDetected.toLocaleDateString()} ${firstDetected.toLocaleTimeString()}</span>
          </div>
          <div class="detail-row">
            <span class="label">Last seen:</span>
            <span class="value">${lastSeen}</span>
          </div>
        </div>
        <div class="pileup-footer">
          <span class="hint">Click to show on map →</span>
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
