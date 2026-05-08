const { createApp } = Vue;

createApp({
    data() {
        return {
            showRightPanel: false,
            showNotification: true,
            isRefreshing: false,
            compareEnabled: false,
            dateRange: '2025年12月9日 - 2026年3月24日',
            pageSize: 10,
            pageSizeOptions: [10, 30, 50, 100],
            showPageSizeDropdown: false,
            currentPage: 1,
            sortKey: '',
            sortOrderList: {
                campaign: 'desc',
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
            filterText: localStorage.getItem('filterText') || '',
            accountText: localStorage.getItem('accountText') || '2 accounts',
            campaigns: [
                {
                    campaign: '0254-PH Space Race-Kilay',
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
            selectedDateOption: 'yesterday',
            startDate: null,
            endDate: null,
            calendarMonth: new Date(),
            selectingStartDate: true,
            dateSelectRef: null
            
        }
    },
    computed: {
        filteredCampaigns() {
            let result = this.campaigns;
            if (this.startDate && this.endDate) {
                const start = new Date(this.startDate);
                const end = new Date(this.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                result = result.filter(campaign => {
                    if (!campaign.date) return true;
                    const campaignDate = new Date(campaign.date);
                    return campaignDate >= start && campaignDate <= end;
                });
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
            const order = this.sortOrderList[key];
            return [...this.filteredCampaigns].sort((a, b) => {
                let aVal = a[key];
                let bVal = b[key];
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
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
            return Math.ceil(this.filteredCampaigns.length / this.pageSize);
        },
        showPagination() {
            return this.filteredCampaigns.length > this.pageSize;
        },
        startRow() {
            return (this.currentPage - 1) * this.pageSize + 1;
        },
        endRow() {
            return Math.min(this.currentPage * this.pageSize, this.filteredCampaigns.length);
        },
        yesterdayDate() {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            return yesterday.toLocaleDateString('en-US', options);
        },
        totals() {
            const result = this.filteredCampaigns.reduce((acc, campaign) => {
                acc.cost += campaign.cost;
                acc.impressions += campaign.impressions;
                acc.clicks += campaign.clicks;
                acc.installs += campaign.installs;
                acc.inAppActions += campaign.inAppActions;
                acc.ctr += 0;
                return acc;
            }, {
                cost: 0,
                impressions: 0,
                clicks: 0,
                installs: 0,
                inAppActions: 0,
                costPerAction: 0,
                ctr: 0,
            });
            if (this.filteredCampaigns.length > 0 && Number(result.impressions) > 0) {
                result.ctr = (Number(result.clicks) / Number(result.impressions)).toFixed(2);
            } else {
                result.ctr = '0.00';
            }
            return result;
        }
    },
    methods: {
        toggleRightPanel() {
        this.showRightPanel = !this.showRightPanel;
    },
    closeRightPanel() {
        this.showRightPanel = false;
    },
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
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
                if (this.startDate) {
                    this.calendarMonth = new Date(this.startDate);
                } else {
                    this.calendarMonth = new Date();
                }
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
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    this.startDate = new Date(yesterday);
                    this.endDate = new Date(yesterday);
                    break;
                case 'thisWeekSunSat':
                    const thisWeekStartSun = new Date(today);
                    const dayOfWeekSun = thisWeekStartSun.getDay();
                    const diffToSun = dayOfWeekSun;
                    thisWeekStartSun.setDate(thisWeekStartSun.getDate() - diffToSun);
                    this.startDate = new Date(thisWeekStartSun);
                    this.endDate = new Date(today);
                    break;
                case 'thisWeekMonSun':
                    const thisWeekStartMon = new Date(today);
                    const dowMon = thisWeekStartMon.getDay();
                    const diffToMon = dowMon === 0 ? 6 : dowMon - 1;
                    thisWeekStartMon.setDate(thisWeekStartMon.getDate() - diffToMon);
                    this.startDate = new Date(thisWeekStartMon);
                    this.endDate = new Date(today);
                    break;
                case 'last7Days':
                    const last7Days = new Date(today);
                    last7Days.setDate(last7Days.getDate() - 7);
                    this.startDate = last7Days;
                    const yesterdayFor7 = new Date(today);
                    yesterdayFor7.setDate(yesterdayFor7.getDate() - 1);
                    this.endDate = yesterdayFor7;
                    break;
                case 'lastWeekSunSat':
                    const lastWeekSunSat = new Date(today);
                    const dayOfWeek = lastWeekSunSat.getDay();
                    const diffToLastSun = dayOfWeek === 0 ? 7 : dayOfWeek;
                    lastWeekSunSat.setDate(lastWeekSunSat.getDate() - diffToLastSun);
                    this.startDate = new Date(lastWeekSunSat);
                    const lastSat = new Date(lastWeekSunSat);
                    lastSat.setDate(lastSat.getDate() + 6);
                    this.endDate = lastSat;
                    break;
                case 'lastWeekMonSun':
                    const lastWeekMonSun = new Date(today);
                    const dow = lastWeekMonSun.getDay();
                    const diffToLastMon1 = dow === 1 ? 7 : (dow === 0 ? 6 : dow - 1);
                    lastWeekMonSun.setDate(lastWeekMonSun.getDate() - diffToLastMon1);
                    this.startDate = new Date(lastWeekMonSun);
                    const lastSun = new Date(lastWeekMonSun);
                    lastSun.setDate(lastSun.getDate() + 6);
                    this.endDate = lastSun;
                    break;
                case 'lastBusinessWeek':
                    const lastBusinessWeekStart = new Date(today);
                    const d = lastBusinessWeekStart.getDay();
                    const diffToLastMon2 = d === 1 ? 7 : (d === 0 ? 6 : d - 1);
                    lastBusinessWeekStart.setDate(lastBusinessWeekStart.getDate() - diffToLastMon2);
                    this.startDate = new Date(lastBusinessWeekStart);
                    const lastFri = new Date(lastBusinessWeekStart);
                    lastFri.setDate(lastFri.getDate() + 4);
                    this.endDate = lastFri;
                    break;
                case 'last14Days':
                    const last14Days = new Date(today);
                    last14Days.setDate(last14Days.getDate() - 14);
                    this.startDate = last14Days;
                    const yesterdayFor14 = new Date(today);
                    yesterdayFor14.setDate(yesterdayFor14.getDate() - 1);
                    this.endDate = yesterdayFor14;
                    break;
                case 'thisMonth':
                    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    this.startDate = thisMonthStart;
                    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    this.endDate = thisMonthEnd;
                    break;
                case 'last30Days':
                    const last30Days = new Date(today);
                    last30Days.setDate(last30Days.getDate() - 29);
                    this.startDate = last30Days;
                    this.endDate = new Date(today);
                    break;
                case 'lastMonth':
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    this.startDate = lastMonth;
                    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                    this.endDate = lastMonthEnd;
                    break;
                case 'allTime':
                    this.startDate = new Date(2000, 0, 1);
                    this.endDate = new Date();
                    break;
            }
            if (this.startDate) {
                this.calendarMonth = new Date(this.startDate);
            }
            this.$nextTick(() => {
                this.scrollToSelectedDate();
            });
            this.applyDateRange();
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
        prevMonth() {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1);
        },
        nextMonth() {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1);
        },
        navigateMonth(direction) {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + direction, 1);
        },
        applyDateRange() {
            this.showDatePicker = false;
        },
        cancelDateRange() {
            this.showDatePicker = false;
        },
        formatCurrency(value) {
            if (value === 0 || value === undefined) return '-';
            const fixedValue = value.toFixed(2);
            const parts = fixedValue.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return '$' + parts.join('.');
        },
        formatNumber(value, decimals = 0) {
            if (value === 0 || value === undefined) return '-';
            return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        },
        formatPercent(value) {
            if (value === 0 || value === undefined) return '-';
            const numValue = Number(value);
            if (isNaN(numValue)) return '-';
            return `${numValue.toFixed(2)}%`;
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortOrderList[key] = this.sortOrderList[key] === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortOrderList[key] = 'desc';
            }
        },
        toggleSelectAll() {
            this.campaigns.forEach(campaign => {
                campaign.selected = this.selectAll;
            });
        },
        downloadReport() {
            alert('下载功能开发中...');
        },
        saveFilter() {
            localStorage.setItem('filterText', this.filterText);
        },
        clearFilter() {
            this.filterText = '';
            localStorage.removeItem('filterText');
        },
        saveAccountText() {
            localStorage.setItem('accountText', this.accountText);
        },
        clearAccountText() {
            this.accountText = '2 accounts';
            localStorage.removeItem('accountText');
        },
        async loadTableData() {
            try {
                const response = await fetch('/assets/tableData.json', { cache: 'no-store' });
                let data = await response.json();
                const today = new Date();
                data = data.map((item, index) => {
                    const date = new Date(today);
                    date.setDate(date.getDate() - index);
                    const campaign = {
                        ...item,
                        id: item.id || `${item.campaign}-${index}`,
                        date: date.toISOString()
                    };
                    return campaign;
                });
                this.campaigns = JSON.parse(JSON.stringify(data));
            } catch (error) {
            }
        },
        async refreshPage() {
            if (this.isRefreshing) return;
            this.isRefreshing = true;
            this.showDatePicker = false;
            this.showPageSizeDropdown = false;
            try {
                await this.$nextTick();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                await Promise.all([
                    this.loadTableData(),
                    new Promise(resolve => setTimeout(resolve, 1400))
                ]);
                this.currentPage = 1;
            } finally {
                this.isRefreshing = false;
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
    },
    async mounted() {
        await this.loadTableData();
        this.selectDateOption('yesterday');
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    watch: {
        campaigns: {
            handler(newValue) {
                this.selectAll = newValue.every(campaign => campaign.selected);
            },
            deep: true
        }
    }
}).mount('#app');
