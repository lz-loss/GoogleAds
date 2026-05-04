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
                },]
        }
    },
    computed: {
        filteredCampaigns() {
            return this.campaigns;
            // if (!this.filterText) {
            //     return this.campaigns;
            // }
            // const filter = this.filterText.toLowerCase();
            // return this.campaigns.filter(campaign =>
            //     campaign.name.toLowerCase().includes(filter)
            // );
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
                const data = await response.json();
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
    mounted() {
        this.loadTableData();
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
