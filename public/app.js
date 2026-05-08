const { createApp } = Vue;

createApp({
    data() {
        return {
            showNotification: true,
            compareEnabled: false,
            dateRange: '2025年12月9日 - 2026年3月24日',
            pageSize: 10,
            pageSizeOptions: [10, 30, 50, 100],
            showPageSizeDropdown: false,
            currentPage: 1,
            sortKey: '',
            sortOrderList: {
                campaign: 'desc',
                date: 'desc',
                status: 'desc',
                cost: 'desc',
                impressions: 'desc',
                clicks: 'desc',
                installs: 'desc',
                inAppActions: 'desc',
                costPerInstall: 'desc',
                costPerInAppActions: 'desc',
                ctr: 'desc',
            },
            selectAll: false,
            searchText: localStorage.getItem('searchText') || '',
            filterText: localStorage.getItem('filterText') || '',
            accountText: localStorage.getItem('accountText') || '2 accounts',
            statusFilter: localStorage.getItem('statusFilter') || 'all',
            highIntentOnly: localStorage.getItem('highIntentOnly') === 'true',
            showFilterMenu: false,
            showColumnsPanel: false,
            detailCampaign: null,
            toastMessage: '',
            toastTimer: null,
            metricColumns: [
                { key: 'cost', label: 'Cost', type: 'currency', visible: true },
                { key: 'impressions', label: 'Impr.', type: 'number', visible: true },
                { key: 'clicks', label: 'Clicks', type: 'number', visible: true },
                { key: 'installs', label: 'Installs', type: 'decimal', visible: true },
                { key: 'inAppActions', label: 'In-app actions', type: 'decimal', visible: true },
                { key: 'costPerInstall', label: 'Cost / Install', type: 'currency', visible: true },
                { key: 'costPerInAppActions', label: 'Cost / In-app action', type: 'currency', visible: true },
                { key: 'ctr', label: 'CTR', type: 'percent', visible: true },
            ],
            campaigns: [
                {
                    id: 'seed-1',
                    campaign: '0254-PH Space Race-Kilay',
                    status: 'enabled',
                    statusLabel: 'Enabled',
                    cost: 7.93,
                    impressions: 32,
                    clicks: 3,
                    installs: 0.78,
                    inAppActions: 0.38,
                    costPerInstall: 10.17,
                    costPerInAppActions: 20.87,
                    ctr: 9.38,
                    selected: false
                },
            ],
            showDatePicker: false,
            selectedDateOption: 'last30Days',
            startDate: null,
            endDate: null,
            calendarMonth: new Date(),
            selectingStartDate: true,
            dateSelectRef: null
        }
    },
    computed: {
        visibleMetricColumns() {
            const columns = this.metricColumns.filter(column => column.visible);
            return columns.length ? columns : this.metricColumns.slice(0, 1);
        },
        filteredCampaigns() {
            const query = `${this.searchText} ${this.filterText}`.trim().toLowerCase();
            let result = this.campaigns;

            if (this.startDate && this.endDate) {
                const start = new Date(this.startDate);
                const end = new Date(this.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                result = result.filter(campaign => {
                    if (!campaign.date) return true;
                    const campaignDate = this.parseDateOnly(campaign.date);
                    if (!campaignDate) return true;
                    return campaignDate >= start && campaignDate <= end;
                });
            }

            if (this.statusFilter !== 'all') {
                result = result.filter(campaign => campaign.status === this.statusFilter);
            }

            if (this.highIntentOnly) {
                result = result.filter(campaign => Number(campaign.clicks) > 100);
            }

            if (query) {
                result = result.filter(campaign => this.matchesQuery(campaign, query));
            }

            return result;
        },
        calendarMonths() {
            const months = [];
            const baseDate = this.calendarMonth;
            for (let i = -6; i < 6; i++) {
                const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
                const calendarData = this.getCalendarWeeks(targetDate);
                months.push({
                    date: targetDate,
                    monthYear: targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
                    weeks: calendarData.weeks,
                    firstWeekCurrentMonthDays: calendarData.firstWeekCurrentMonthDays,
                    showTitleInline: calendarData.firstWeekCurrentMonthDays < 4
                });
            }
            return months;
        },
        calendarMonthYear() {
            return this.calendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
        },
        formattedStartDate() {
            if (!this.startDate) return '';
            return this.formatDate(this.startDate);
        },
        formattedEndDate() {
            if (!this.endDate) return '';
            return this.formatDate(this.endDate);
        },
        dropdownStyle() {
            if (!this.showDatePicker || !this.$refs.dateSelectRef) {
                return {};
            }
            const rect = this.$refs.dateSelectRef.getBoundingClientRect();
            return {
                position: 'fixed',
                top: rect.bottom - 80 + 'px',
                right: (150) + 'px',
                zIndex: '10000'
            };
        },
        sortedCampaigns() {
            if (!this.sortKey) {
                return this.filteredCampaigns;
            }
            const key = this.sortKey;
            const order = this.sortOrderList[key] || 'desc';
            return [...this.filteredCampaigns].sort((a, b) => {
                let aVal = a[key];
                let bVal = b[key];
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = String(bVal || '').toLowerCase();
                }
                if (aVal < bVal) return order === 'asc' ? -1 : 1;
                if (aVal > bVal) return order === 'asc' ? 1 : -1;
                return 0;
            });
        },
        paginatedCampaigns() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.sortedCampaigns.slice(start, end);
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.filteredCampaigns.length / this.pageSize));
        },
        showPagination() {
            return this.filteredCampaigns.length > this.pageSize;
        },
        startRow() {
            if (this.filteredCampaigns.length === 0) return 0;
            return (this.currentPage - 1) * this.pageSize + 1;
        },
        endRow() {
            return Math.min(this.currentPage * this.pageSize, this.filteredCampaigns.length);
        },
        selectedCampaigns() {
            return this.campaigns.filter(campaign => campaign.selected);
        },
        pageSelectionState() {
            return this.paginatedCampaigns.length > 0 && this.paginatedCampaigns.every(campaign => campaign.selected);
        },
        yesterdayDate() {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            return yesterday.toLocaleDateString('en-US', options);
        },
        totals() {
            const result = this.filteredCampaigns.reduce((acc, campaign) => {
                acc.cost += Number(campaign.cost) || 0;
                acc.impressions += Number(campaign.impressions) || 0;
                acc.clicks += Number(campaign.clicks) || 0;
                acc.installs += Number(campaign.installs) || 0;
                acc.inAppActions += Number(campaign.inAppActions) || 0;
                return acc;
            }, {
                cost: 0,
                impressions: 0,
                clicks: 0,
                installs: 0,
                inAppActions: 0,
                costPerInstall: 0,
                costPerInAppActions: 0,
                ctr: 0,
            });

            result.costPerInstall = result.installs ? result.cost / result.installs : 0;
            result.costPerInAppActions = result.inAppActions ? result.cost / result.inAppActions : 0;
            result.ctr = result.impressions ? (result.clicks / result.impressions) * 100 : 0;
            return result;
        }
    },
    methods: {
        getCalendarWeeks(targetDate) {
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDay = firstDay.getDay();
            const weeks = [];
            let currentWeek = [];
            let firstWeekCurrentMonthDays = 0;
            for (let i = 0; i < startDay; i++) {
                const d = new Date(year, month, -startDay + i + 1);
                currentWeek.push({ date: d, isCurrentMonth: false });
            }
            for (let i = 1; i <= lastDay.getDate(); i++) {
                currentWeek.push({ date: new Date(year, month, i), isCurrentMonth: true });
                if (weeks.length === 0) {
                    firstWeekCurrentMonthDays++;
                }
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }
            if (currentWeek.length > 0) {
                for (let i = 1; currentWeek.length < 7; i++) {
                    currentWeek.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
                }
                weeks.push(currentWeek);
            }
            return {
                weeks: weeks,
                firstWeekCurrentMonthDays: firstWeekCurrentMonthDays
            };
        },
        formatDate(date) {
            const d = new Date(date);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const month = monthNames[d.getMonth()];
            const day = d.getDate();
            const year = d.getFullYear();
            return `${month} ${day}, ${year}`;
        },
        getDateOptionLabel(option) {
            const labels = {
                'today': 'Today',
                'yesterday': 'Yesterday',
                'thisWeekSunSat': 'This week (Sun - Today)',
                'thisWeekMonSun': 'This week (Mon - Today)',
                'last7Days': 'Last 7 days (up to yesterday)',
                'lastWeekSunSat': 'Last week (Sun - Sat)',
                'lastWeekMonSun': 'Last week (Mon - Sun)',
                'lastBusinessWeek': 'Last business week (Mon - Fri)',
                'last14Days': 'Last 14 days (up to yesterday)',
                'thisMonth': 'This month',
                'last30Days': 'Last 30 days',
                'lastMonth': 'Last month',
                'allTime': 'All time',
                'custom': 'Custom'
            };
            return labels[option] || 'Custom';
        },
        isSameDay(date1, date2) {
            if (!date1 || !date2) return false;
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        },
        isInRange(date) {
            if (!this.startDate || !this.endDate) return false;
            const d = new Date(date);
            return d >= new Date(this.startDate) && d <= new Date(this.endDate);
        },
        toggleDatePicker(event) {
            event.stopPropagation();
            this.showDatePicker = !this.showDatePicker;
            if (this.showDatePicker) {
                this.calendarMonth = this.startDate ? new Date(this.startDate) : new Date();
                this.$nextTick(() => {
                    this.scrollToSelectedDate();
                });
            }
        },
        scrollToSelectedDate() {
            const scrollContainer = document.querySelector('.calendar-months-scroll');
            if (!scrollContainer || !this.startDate) return;
            const selectedDayElement = document.querySelector('.calendar-day.selected');
            if (selectedDayElement) {
                selectedDayElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        },
        handleClickOutside(event) {
            if (this.showDatePicker) {
                const datePickerEl = document.querySelector('.date-picker-dropdown');
                const dateSelectEl = this.$refs.dateSelectRef;
                if (datePickerEl && !datePickerEl.contains(event.target) &&
                    dateSelectEl && !dateSelectEl.contains(event.target)) {
                    this.cancelDateRange();
                }
            }
        },
        selectDateOption(option) {
            this.selectedDateOption = option;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            switch (option) {
                case 'today':
                    this.startDate = new Date(today);
                    this.endDate = new Date(today);
                    break;
                case 'yesterday': {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    this.startDate = new Date(yesterday);
                    this.endDate = new Date(yesterday);
                    break;
                }
                case 'thisWeekSunSat': {
                    const thisWeekStartSun = new Date(today);
                    const dayOfWeekSun = thisWeekStartSun.getDay();
                    thisWeekStartSun.setDate(thisWeekStartSun.getDate() - dayOfWeekSun);
                    this.startDate = new Date(thisWeekStartSun);
                    this.endDate = new Date(today);
                    break;
                }
                case 'thisWeekMonSun': {
                    const thisWeekStartMon = new Date(today);
                    const dowMon = thisWeekStartMon.getDay();
                    const diffToMon = dowMon === 0 ? 6 : dowMon - 1;
                    thisWeekStartMon.setDate(thisWeekStartMon.getDate() - diffToMon);
                    this.startDate = new Date(thisWeekStartMon);
                    this.endDate = new Date(today);
                    break;
                }
                case 'last7Days': {
                    const last7Days = new Date(today);
                    last7Days.setDate(last7Days.getDate() - 7);
                    this.startDate = last7Days;
                    const yesterdayFor7 = new Date(today);
                    yesterdayFor7.setDate(yesterdayFor7.getDate() - 1);
                    this.endDate = yesterdayFor7;
                    break;
                }
                case 'lastWeekSunSat': {
                    const lastWeekSunSat = new Date(today);
                    const dayOfWeek = lastWeekSunSat.getDay();
                    const diffToLastSun = dayOfWeek === 0 ? 7 : dayOfWeek;
                    lastWeekSunSat.setDate(lastWeekSunSat.getDate() - diffToLastSun);
                    this.startDate = new Date(lastWeekSunSat);
                    const lastSat = new Date(lastWeekSunSat);
                    lastSat.setDate(lastSat.getDate() + 6);
                    this.endDate = lastSat;
                    break;
                }
                case 'lastWeekMonSun': {
                    const lastWeekMonSun = new Date(today);
                    const dow = lastWeekMonSun.getDay();
                    const diffToLastMon1 = dow === 1 ? 7 : (dow === 0 ? 6 : dow - 1);
                    lastWeekMonSun.setDate(lastWeekMonSun.getDate() - diffToLastMon1);
                    this.startDate = new Date(lastWeekMonSun);
                    const lastSun = new Date(lastWeekMonSun);
                    lastSun.setDate(lastSun.getDate() + 6);
                    this.endDate = lastSun;
                    break;
                }
                case 'lastBusinessWeek': {
                    const lastBusinessWeekStart = new Date(today);
                    const d = lastBusinessWeekStart.getDay();
                    const diffToLastMon2 = d === 1 ? 7 : (d === 0 ? 6 : d - 1);
                    lastBusinessWeekStart.setDate(lastBusinessWeekStart.getDate() - diffToLastMon2);
                    this.startDate = new Date(lastBusinessWeekStart);
                    const lastFri = new Date(lastBusinessWeekStart);
                    lastFri.setDate(lastFri.getDate() + 4);
                    this.endDate = lastFri;
                    break;
                }
                case 'last14Days': {
                    const last14Days = new Date(today);
                    last14Days.setDate(last14Days.getDate() - 14);
                    this.startDate = last14Days;
                    const yesterdayFor14 = new Date(today);
                    yesterdayFor14.setDate(yesterdayFor14.getDate() - 1);
                    this.endDate = yesterdayFor14;
                    break;
                }
                case 'thisMonth':
                    this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    this.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    break;
                case 'last30Days': {
                    const last30Days = new Date(today);
                    last30Days.setDate(last30Days.getDate() - 29);
                    this.startDate = last30Days;
                    this.endDate = new Date(today);
                    break;
                }
                case 'lastMonth':
                    this.startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    this.endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case 'allTime':
                    this.startDate = new Date(2000, 0, 1);
                    this.endDate = new Date();
                    break;
                case 'custom':
                    break;
            }
            if (this.startDate) {
                this.calendarMonth = new Date(this.startDate);
            }
            this.currentPage = 1;
            this.$nextTick(() => {
                this.scrollToSelectedDate();
            });
            if (option !== 'custom') {
                this.applyDateRange();
            }
        },
        selectCalendarDate(date) {
            if (this.selectingStartDate) {
                this.startDate = new Date(date);
                this.endDate = null;
                this.selectingStartDate = false;
            } else {
                if (date < this.startDate) {
                    this.endDate = new Date(this.startDate);
                    this.startDate = new Date(date);
                } else {
                    this.endDate = new Date(date);
                }
                this.selectingStartDate = true;
            }
            this.selectedDateOption = 'custom';
            this.calendarMonth = new Date(date);
        },
        selectStartDate() {
            this.selectingStartDate = true;
            this.selectedDateOption = 'custom';
        },
        selectEndDate() {
            this.selectingStartDate = false;
            this.selectedDateOption = 'custom';
        },
        navigateMonth(direction) {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + direction, 1);
        },
        applyDateRange() {
            this.currentPage = 1;
            this.showDatePicker = false;
        },
        cancelDateRange() {
            this.showDatePicker = false;
        },
        formatCurrency(value) {
            if (value === 0 || value === undefined || value === null) return '-';
            const fixedValue = Number(value).toFixed(2);
            const parts = fixedValue.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return '$' + parts.join('.');
        },
        formatNumber(value, decimals = 0) {
            if (value === 0 || value === undefined || value === null) return '-';
            return Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        },
        formatPercent(value) {
            if (value === 0 || value === undefined || value === null) return '-';
            const numValue = Number(value);
            if (isNaN(numValue)) return '-';
            return `${numValue.toFixed(2)}%`;
        },
        displayMetricValue(row, column) {
            const value = row[column.key];
            switch (column.type) {
                case 'currency':
                    return this.formatCurrency(value);
                case 'percent':
                    return this.formatPercent(value);
                case 'decimal':
                    return this.formatNumber(value, 2);
                case 'number':
                default:
                    return this.formatNumber(value);
            }
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortOrderList[key] = this.sortOrderList[key] === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortOrderList[key] = 'desc';
            }
        },
        parseDateOnly(value) {
            if (!value) return null;
            if (value instanceof Date && !Number.isNaN(value.getTime())) {
                return new Date(value.getFullYear(), value.getMonth(), value.getDate());
            }

            if (typeof value === 'number') {
                return this.parseExcelSerialDate(value);
            }

            const text = String(value).trim();
            if (/^\d{5,6}$/.test(text)) {
                return this.parseExcelSerialDate(Number(text));
            }
            const slashMatch = text.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/);
            if (slashMatch) {
                let first = Number(slashMatch[1]);
                const second = Number(slashMatch[2]);
                let third = Number(slashMatch[3]);
                let year = first;
                let month = second;
                let day = third;

                if (slashMatch[1].length !== 4) {
                    year = third;
                    month = first;
                    day = second;
                }

                if (year < 100) {
                    year += 2000;
                }

                return new Date(year, month - 1, day);
            }

            const parsed = new Date(text);
            if (Number.isNaN(parsed.getTime())) return null;
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        },
        parseExcelSerialDate(serial) {
            if (!Number.isFinite(serial)) return null;
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const date = new Date(excelEpoch.getTime() + Math.floor(serial) * 86400000);
            return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        },
        toDateKey(date) {
            if (!date) return '';
            return [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0')
            ].join('-');
        },
        formatDisplayDate(value) {
            const date = this.parseDateOnly(value);
            if (!date) return '-';
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        },
        toggleSelectPage(checked) {
            this.paginatedCampaigns.forEach(campaign => {
                campaign.selected = checked;
            });
        },
        toggleCampaignStatus(campaign) {
            campaign.status = campaign.status === 'enabled' ? 'paused' : 'enabled';
            campaign.statusLabel = campaign.status === 'enabled' ? 'Enabled' : 'Paused';
            this.showToast(`${campaign.statusLabel}: ${campaign.campaign}`);
        },
        openDetails(campaign) {
            this.detailCampaign = campaign;
        },
        setStatusFilter(status) {
            this.statusFilter = status;
            localStorage.setItem('statusFilter', status);
            this.currentPage = 1;
            this.showFilterMenu = false;
        },
        toggleHighIntentFilter() {
            this.highIntentOnly = !this.highIntentOnly;
            localStorage.setItem('highIntentOnly', this.highIntentOnly);
            this.currentPage = 1;
            this.showFilterMenu = false;
        },
        matchesQuery(campaign, query) {
            const searchable = [
                campaign.campaign,
                campaign.date,
                campaign.displayDate,
                campaign.statusLabel,
                campaign.cost,
                campaign.impressions,
                campaign.clicks,
                campaign.installs,
                campaign.inAppActions,
                campaign.ctr
            ].join(' ').toLowerCase();
            return searchable.includes(query);
        },
        buildCsv() {
            const columns = [
                { key: 'campaign', label: 'Campaign' },
                { key: 'displayDate', label: 'Date' },
                { key: 'statusLabel', label: 'Status' },
                ...this.visibleMetricColumns.map(column => ({ key: column.key, label: column.label }))
            ];
            const rows = this.filteredCampaigns.map(campaign => {
                return columns.map(column => {
                    const value = campaign[column.key] === undefined ? '' : campaign[column.key];
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',');
            });
            return [columns.map(column => `"${column.label}"`).join(','), ...rows].join('\n');
        },
        downloadReport() {
            const csv = this.buildCsv();
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'google-ads-report.csv';
            link.click();
            URL.revokeObjectURL(url);
            this.showToast(`Downloaded ${this.filteredCampaigns.length} rows`);
        },
        refreshData() {
            this.loadTableData();
            this.showToast('Report refreshed');
        },
        showToast(message) {
            this.toastMessage = message;
            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                this.toastMessage = '';
            }, 2400);
        },
        resetDemoState() {
            this.searchText = '';
            this.filterText = '';
            this.statusFilter = 'all';
            this.highIntentOnly = false;
            this.currentPage = 1;
            this.detailCampaign = null;
            localStorage.removeItem('searchText');
            localStorage.removeItem('filterText');
            localStorage.setItem('statusFilter', 'all');
            localStorage.removeItem('highIntentOnly');
            this.selectDateOption('last30Days');
            this.showToast('Report view reset');
        },
        saveSearchText() {
            localStorage.setItem('searchText', this.searchText);
            this.currentPage = 1;
        },
        saveFilter() {
            localStorage.setItem('filterText', this.filterText);
            this.currentPage = 1;
        },
        clearFilter() {
            this.filterText = '';
            this.searchText = '';
            localStorage.removeItem('filterText');
            localStorage.removeItem('searchText');
            this.currentPage = 1;
        },
        saveAccountText() {
            localStorage.setItem('accountText', this.accountText);
        },
        clearAccountText() {
            this.accountText = '2 accounts';
            localStorage.removeItem('accountText');
        },
        normalizeCampaign(item, index) {
            const today = new Date();
            let parsedDate = this.parseDateOnly(item.date);
            if (!parsedDate) {
                parsedDate = new Date(today);
                parsedDate.setDate(parsedDate.getDate() - (index % 21));
            }
            const status = index % 5 === 0 ? 'paused' : 'enabled';
            const dateKey = this.toDateKey(parsedDate);
            return {
                ...item,
                id: item.id || `campaign-${index}`,
                status,
                statusLabel: status === 'enabled' ? 'Enabled' : 'Paused',
                selected: false,
                date: dateKey,
                displayDate: this.formatDisplayDate(dateKey),
            };
        },
        async loadTableData() {
            try {
                const response = await fetch('/assets/tableData.json');
                const data = await response.json();
                this.campaigns = data.map((item, index) => this.normalizeCampaign(item, index));
            } catch (error) {
                this.showToast('Unable to load report data');
            }
        },
        togglePageSizeDropdown() {
            this.showPageSizeDropdown = !this.showPageSizeDropdown;
        },
        setPageSize(size) {
            this.pageSize = size;
            this.currentPage = 1;
            this.showPageSizeDropdown = false;
        },
        goToPage(page) {
            this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
        },
    },
    async mounted() {
        await this.loadTableData();
        this.selectDateOption('last30Days');
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
        clearTimeout(this.toastTimer);
    },
    watch: {
        filteredCampaigns() {
            if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages;
            }
        },
        campaigns: {
            handler(newValue) {
                this.selectAll = newValue.length > 0 && newValue.every(campaign => campaign.selected);
            },
            deep: true
        }
    }
}).mount('#app');
