import React from 'react';
import ChartCard from '../../components/ChartCard';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';

const ongoingItems = [
  { type: 'Bug', title: 'Play Store Review Integration not working', latestUpdate: 'Working with internal teams', startDate: '03-02-2026', aging: 20 },
  { type: 'Improvement', title: 'Deactivate Flows (old queue as Case Owner)', latestUpdate: 'Queue impact checking', startDate: '05-02-2026', aging: 18 },
  { type: 'Improvement', title: 'User cannot enter phone number on form', latestUpdate: 'Released 23/02/2026', startDate: '09-02-2026', aging: 14 },
  { type: 'Improvement', title: 'Report Metrics, Article & Chatbot Dashboard', latestUpdate: 'In progress for P0s', startDate: '16-02-2026', aging: 7 },
];

const nextUpItems = [
  { title: 'Favicon of support/faq pages shows Salesforce logo', priority: 'P2', status: 'Up Next' },
  { title: 'Livechat suddenly ended', priority: 'P0', status: 'Up Next' },
  { title: 'Waiting on User tickets stays the same after 72h', priority: 'P1', status: 'Up Next' },
  { title: 'Close Unsolved Tickets', priority: 'P1', status: 'Up Next' },
];

function agingColor(days) {
  if (days > 14) return 'error';
  if (days >= 7) return 'warning';
  return 'success';
}

function priorityVariant(p) {
  if (p === 'P0') return 'error';
  if (p === 'P1') return 'warning';
  return 'info';
}

export default function SFTracker() {
  return (
    <div className="page">
      <div className="page-title">Salesforce Tracker</div>

      <ChartCard title="What's Ongoing?" subtitle="Active SF configuration requests and bugs">
        <DataTable
          columns={[
            {
              key: 'type', label: 'Type', align: 'center',
              render: (v) => (
                <Badge variant={v === 'Bug' ? 'error' : 'info'}>
                  {v}
                </Badge>
              ),
            },
            { key: 'title', label: 'Request Title' },
            { key: 'latestUpdate', label: 'Latest Update' },
            { key: 'startDate', label: 'Start Date', mono: true },
            {
              key: 'aging', label: 'Aging (days)', align: 'center', mono: true,
              render: (v) => (
                <Badge variant={agingColor(v)}>
                  {v}d
                </Badge>
              ),
            },
          ]}
          data={ongoingItems}
          pageSize={10}
          mock
        />
      </ChartCard>

      <ChartCard title="What Shall Be Picked Up Next?" subtitle="Prioritized backlog">
        <DataTable
          columns={[
            { key: 'title', label: 'Request Title' },
            {
              key: 'priority', label: 'Priority', align: 'center',
              render: (v) => (
                <Badge variant={priorityVariant(v)}>
                  {v}
                </Badge>
              ),
            },
            {
              key: 'status', label: 'Status', align: 'center',
              render: (v) => (
                <Badge variant="purple">
                  {v}
                </Badge>
              ),
            },
          ]}
          data={nextUpItems}
          pageSize={10}
          mock
        />
      </ChartCard>
    </div>
  );
}
