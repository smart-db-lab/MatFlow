import { Table } from "@nextui-org/react";
import React from "react";

function NextTable({ rowData }) {
  // console.log(rowData);
  const columnName = Object.keys(rowData && rowData.length ? rowData[0] : []);
  return (
    <>
      {rowData && rowData.length ? (
        <Table shadow={false} lined striped compact>
          <Table.Header>
            {columnName.map((val, ind) => (
              <Table.Column key={ind}>{val}</Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {rowData.map((val, ind) => {
              return (
                <Table.Row key={ind}>
                  {columnName.map((v, i) => {
                    return (
                      <Table.Cell key={i}>
                        {typeof val[v] === "string" ||
                        typeof val[v] === "number"
                          ? val[v]
                          : JSON.stringify(val[v])}
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      ) : (
        <div>
          <h1 className="font-medium text-lg">No data found</h1>
        </div>
      )}
    </>
  );
}

export default NextTable;
