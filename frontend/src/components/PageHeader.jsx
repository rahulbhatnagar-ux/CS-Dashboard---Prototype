import React from 'react';
import DataSourceLabel from './DataSourceLabel';

/**
 * Consistent page header with title and optional data source label.
 *
 * Usage:
 *   <PageHeader title="CO Dashboard" source="salesforce" updated="2026-02-25" />
 *   <PageHeader title="CSAT Analysis" source={data?._source} updated={data?._updated}>
 *     <AlertBanner>...</AlertBanner>
 *   </PageHeader>
 */
export default function PageHeader({ title, source, updated, badge, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="page-title">{title}</div>
          {badge}
        </div>
        {source && <DataSourceLabel source={source} updated={updated} />}
      </div>
      {children}
    </div>
  );
}
