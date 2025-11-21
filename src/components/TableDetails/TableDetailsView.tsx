import React, { useState, useEffect } from 'react';
import { Column, Index, Relation } from '../../types';
import { databaseAPI } from '../../services/api';
import DataTab from './DataTab';
import StructureTab from './StructureTab';
import IndexesTab from './IndexesTab';
import DDLTab from './DDLTab';

interface TableDetailsViewProps {
  connectionId: number;
  tableName: string;
  onClose: () => void;
}

type TabType = 'data' | 'structure' | 'indexes' | 'relations' | 'ddl';

const TableDetailsView: React.FC<TableDetailsViewProps> = ({
  connectionId,
  tableName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [columns, setColumns] = useState<Column[]>([]);
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [ddl, setDdl] = useState<string>('');
  const [stats, setStats] = useState<{ row_count: number; size: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTableInfo();
  }, [connectionId, tableName]);

  const loadTableInfo = async () => {
    setLoading(true);
    try {
      const [columnsRes, indexesRes, relationsRes, ddlRes, statsRes] = await Promise.all([
        databaseAPI.getColumns(connectionId, tableName),
        databaseAPI.getIndexes(connectionId, tableName),
        databaseAPI.getRelations(connectionId, tableName),
        databaseAPI.getDDL(connectionId, tableName),
        databaseAPI.getStats(connectionId, tableName),
      ]);

      setColumns(columnsRes.data);
      setIndexes(indexesRes.data);
      setRelations([...relationsRes.data.outgoing, ...relationsRes.data.incoming]);
      setDdl(ddlRes.data.ddl);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load table info:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {tableName}
            </h2>
            {stats && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.row_count.toLocaleString()} rows • {stats.size}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'data', label: 'Data' },
            { id: 'structure', label: 'Structure' },
            { id: 'indexes', label: 'Indexes' },
            { id: 'relations', label: 'Relations' },
            { id: 'ddl', label: 'DDL' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : (
            <>
              {activeTab === 'data' && (
                <DataTab connectionId={connectionId} tableName={tableName} />
              )}
              {activeTab === 'structure' && <StructureTab columns={columns} />}
              {activeTab === 'indexes' && <IndexesTab indexes={indexes} />}
              {activeTab === 'relations' && (
                <div className="p-6">
                  {relations.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No relations found</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-200">Constraint</th>
                          <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-200">Column</th>
                          <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-200">References</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relations.map((rel, idx) => (
                          <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{rel.constraint_name}</td>
                            <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{rel.column_name}</td>
                            <td className="py-2 px-4 text-gray-600 dark:text-gray-400">
                              {rel.foreign_table_name && rel.foreign_column_name
                                ? `${rel.foreign_table_name}(${rel.foreign_column_name})`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              {activeTab === 'ddl' && <DDLTab ddl={ddl} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableDetailsView;

