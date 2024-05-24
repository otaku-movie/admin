const columns: TableColumnsType<Movie> = [
  {
    title: t('table.name'),
    dataIndex: 'name'
  },
  {
    title: t('table.action'),
    key: 'operation',
    fixed: 'right',
    width: 200,
    render: (_, row) => {
      return (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              router.push(
                processPath('movieDetail', {
                  id: row.id
                })
              )
            }}
          >
            {t('button.edit')}
          </Button>
          <Button type="primary" onClick={() => {}}>
            {t('button.configMenu')}
          </Button>
          <Button type="primary" onClick={() => {}}>
            {t('button.configButton')}
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => {
              Modal.confirm({
                title: t('button.remove'),
                content: t('message.remove.content'),
                onCancel() {
                  console.log('Cancel')
                },
                onOk() {
                  return new Promise((resolve, reject) => {
                    http({
                      url: 'movie/remove',
                      method: 'delete',
                      params: {
                        id: row.id
                      }
                    })
                      .then(() => {
                        message.success(t('message.remove.success'))
                        getData()
                        resolve(true)
                      })
                      .catch(reject)
                  })
                }
              })
            }}
          >
            {t('button.remove')}
          </Button>
        </Space>
      )
    }
  }
]