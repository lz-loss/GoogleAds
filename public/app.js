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
            // 日期选择相关状态
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
            // 日期筛选
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
            // if (!this.filterText) {
            //     return this.campaigns;
            // }
            // const filter = this.filterText.toLowerCase();
            // return this.campaigns.filter(campaign =>
            //     campaign.name.toLowerCase().includes(filter)
            // );
        },
        // 计算12个月的日历
        calendarMonths() {
            const months = [];
            // 以当前选择的月份为中心，生成12个月
            const baseDate = this.calendarMonth;
            // 向前推6个月，然后展示12个月
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
            // 计算下拉框位置
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
            // 只有当数据行数超过每页显示行数时才显示分页
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

            // 计算 ctr 平均值
            if (this.filteredCampaigns.length > 0 && Number(result.impressions) > 0) {
                result.ctr = (Number(result.clicks) / Number(result.impressions)).toFixed(2);
            } else {
                result.ctr = '0.00';
            }

            return result;
        }
    },
    methods: {
        // 计算单个月的日历
        getCalendarWeeks(targetDate) {
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDay = firstDay.getDay(); // 0-6, 0是周日

            const weeks = [];
            let currentWeek = [];
            let firstWeekCurrentMonthDays = 0;

            // 上个月的日期
            for (let i = 0; i < startDay; i++) {
                const d = new Date(year, month, -startDay + i + 1);
                currentWeek.push({ date: d, isCurrentMonth: false });
            }

            // 当月的日期
            for (let i = 1; i <= lastDay.getDate(); i++) {
                currentWeek.push({ date: new Date(year, month, i), isCurrentMonth: true });
                // 计算第一周有多少个当月日期
                if (weeks.length === 0) {
                    firstWeekCurrentMonthDays++;
                }
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }

            // 下个月的日期
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
        // 格式化日期
        formatDate(date) {
            const d = new Date(date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear();
            return `${month}/${day}/${year}`;
        },
        // 检查是否是同一天
        isSameDay(date1, date2) {
            if (!date1 || !date2) return false;
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        },
        // 检查日期是否在选中范围内
        isInRange(date) {
            if (!this.startDate || !this.endDate) return false;
            const d = new Date(date);
            return d >= new Date(this.startDate) && d <= new Date(this.endDate);
        },
        // 切换日期选择弹窗
        toggleDatePicker(event) {
            event.stopPropagation();
            this.showDatePicker = !this.showDatePicker;
            if (this.showDatePicker) {
                // 如果已经选择了日期，日历显示选中日期所在的月份
                if (this.startDate) {
                    this.calendarMonth = new Date(this.startDate);
                } else {
                    this.calendarMonth = new Date();
                }
            }
        },
        // 点击外部关闭
        handleClickOutside(event) {
            if (this.showDatePicker) {
                // 检查点击是否在日期选择器内部
                const datePickerEl = document.querySelector('.date-picker-dropdown');
                const dateSelectEl = this.$refs.dateSelectRef;
                if (datePickerEl && !datePickerEl.contains(event.target) &&
                    dateSelectEl && !dateSelectEl.contains(event.target)) {
                    this.cancelDateRange();
                }
            }
        },
        // 选择日期选项
        selectDateOption(option) {
            this.selectedDateOption = option;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (option) {
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    this.startDate = new Date(yesterday);
                    this.endDate = new Date(yesterday);
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
        },
        // 选择日历中的日期
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
        },
        // 切换开始日期选择
        selectStartDate() {
            this.selectingStartDate = true;
            this.selectedDateOption = 'custom';
        },
        selectEndDate() {
            this.selectingStartDate = false;
            this.selectedDateOption = 'custom';
        },
        // 日历导航
        prevMonth() {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1);
        },
        nextMonth() {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1);
        },
        navigateMonth(direction) {
            this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + direction, 1);
        },
        // 应用日期筛选
        applyDateRange() {
            this.showDatePicker = false;
            // 这里可以添加日期筛选逻辑
        },
        // 取消
        cancelDateRange() {
            this.showDatePicker = false;
        },
        formatCurrency(value) {
            if (value === 0 || value === undefined) return '-';
            // return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            // 手动添加美元符号和千位分隔符，确保在所有浏览器上显示一致
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
            // 确保 value 是数字类型
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

        // 从 tableData.json 加载数据
        async loadTableData() {
            try {
                const response = await fetch('/assets/tableData.json');
                let data = await response.json();
                // 为数据添加日期字段（用于演示筛选功能）
                const today = new Date();
                data = data.map((item, index) => {
                    const date = new Date(today);
                    date.setDate(date.getDate() - index);
                    return {
                        ...item,
                        date: date.toISOString()
                    };
                });
                this.campaigns = JSON.parse(JSON.stringify(data));
            } catch (error) {
            }
        },
        togglePageSizeDropdown() {
            this.showPageSizeDropdown = !this.showPageSizeDropdown;
        },
        setPageSize(size) {
            this.pageSize = size;
            this.currentPage = 1; // 重置到第一页
            this.showPageSizeDropdown = false;
        },
    },
    async mounted() {
        await this.loadTableData();
        // 初始化默认日期为昨天
        this.selectDateOption('yesterday');
        // 添加点击外部关闭监听
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        // 移除监听器
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
