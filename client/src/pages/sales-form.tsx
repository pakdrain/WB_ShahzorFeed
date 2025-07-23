                      "itemDescription",
                                e.target.value,
                              )
                            }
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-form-type="other"
                          />
                        </div>
                        <div className="bg-white border border-gray-300 p-1">
                          <input
                            type="text"
                            className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right"
                            value={salesData[index]?.dcQty || ""}
                            onChange={(e) =>
                              handleSalesDataChange(
                                index,
                                "dcQty",
                                e.target.value,
                              )
                            }
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-form-type="other"
                          />
                        </div>
                        <div className="bg-white border border-gray-300 p-1">
                          <input
                            type="text"
                            className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right"
                            value={salesData[index]?.doQty || ""}
                            onChange={(e) =>
                              handleSalesDataChange(
                                index,
                                "doQty",
                                e.target.value,
                              )
                            }
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-form-type="other"
                          />
                        </div>
                        <div className="bg-white border border-gray-300 p-1">
                          <input
                            type="text"
                            className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right"
                            value={salesData[index]?.branch || ""}
                            onChange={(e) =>
                              handleSalesDataChange(
                                index,
                                "branch",
                                e.target.value,
                              )
                            }
                            autoComplete="off"
                          />
                        </div>

                        <div className="bg-white border border-gray-300 p-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleSalesRowDelete(index)}
                            className="text-red-500 hover:text-red-700 text-lg font-bold"
                            title="Delete row"
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Row */}
                  <div
                    className="grid gap-px text-xs font-semibold mb-4"
                    style={{
                      gridTemplateColumns:
                        "100px 100px 240px 140px 120px 180px 100px 100px 140px",
                      width: "1220px",
                      height: "30px",
                    }}
                  >
                    <div className="bg-gray-200 border border-gray-400 p-1"></div>
                    <div className="bg-gray-200 border border-gray-400 p-1"></div>
                    <div className="bg-gray-200 border border-gray-400 p-1"></div>
                    <div className="bg-gray-200 border border-gray-400 p-1"></div>
                    <div className="bg-gray-200 border border-gray-400 p-1"></div>
                    <div className="bg-gray-200 border border-gray-400 p-1 flex items-center justify-end">
                      <span className="text-black">Total:</span>
                    </div>
                    <div className="bg-white border border-gray-400 p-1">
                      <input
                        type="text"
                        className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right font-semibold"
                        readOnly
                        value={salesData.reduce(
                          (sum, row) => sum + (parseFloat(row.dcQty) || 0),
                          0,
                        )}
                      />
                    </div>
                    <div className="bg-white border border-gray-400 p-1">
                      <input
                        type="text"
                        className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right font-semibold"
                        readOnly
                        value={salesData.reduce(
                          (sum, row) => sum + (parseFloat(row.doQty) || 0),
                          0,
                        )}
                      />
                    </div>
                    <div className="bg-gray-200 border border-gray-400 p-1"></div>
                  </div>

                  {/* Bottom section with Weight Per Bags, Total Weight Out, and Total Feed Bags - matching image layout */}
                  <div
                    className="bg-gray-100 p-2 flex justify-between items-center border border-gray-300 mt-2"
                    style={{ width: "1220px" }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-medium text-black">
                          Weight Per Bags:
                        </label>
                        <input
                          type="text"
                          className="w-24 h-6 text-xs border border-gray-300 px-2 focus:outline-none"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-medium text-black">
                          Total Weight Out:
                        </label>
                        <input
                          type="text"
                          className="w-24 h-6 text-xs border border-gray-300 px-2 focus:outline-none"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-medium text-black">
                          Total Feed Bags:
                        </label>
                        <input
                          type="text"
                          className="w-24 h-6 text-xs border border-gray-300 px-2 focus:outline-none"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-black">
                        Total Weight Dill:
                      </label>
                      <input
                        type="text"
                        className="w-32 h-8 text-sm border border-gray-300 px-2 focus:outline-none"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-black">
                        Total Feed Bags:
                      </label>
                      <input
                        type="text"
                        className="w-32 h-8 text-sm border border-gray-300 px-2 focus:outline-none"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Weight Display and Bag Table (Columns 9-12) */}
            <div className="col-span-4">
              {/* This section will contain the right side components */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}