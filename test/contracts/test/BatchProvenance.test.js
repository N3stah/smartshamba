const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BatchProvenance", function () {
  it("Should allow authorized writer to record an anchor", async function () {
    const [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BatchProvenance");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    const batchRef = "BATCH-001";
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence"));
    
    const tx = await contract.recordAnchor(batchRef, evidenceHash);
    await tx.wait();
    
    const storedHash = await contract.getAnchor(batchRef);
    expect(storedHash).to.equal(evidenceHash);
  });

  it("Should reject unauthorized writers", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BatchProvenance");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    const batchRef = "BATCH-002";
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence"));
    
    await expect(
      contract.connect(addr1).recordAnchor(batchRef, evidenceHash)
    ).to.be.revertedWith("Unauthorized: Only authorized writer can record anchors");
  });

  it("Should reject duplicate anchors", async function () {
    const [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BatchProvenance");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    const batchRef = "BATCH-003";
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence"));
    
    await contract.recordAnchor(batchRef, evidenceHash);
    
    await expect(
      contract.recordAnchor(batchRef, evidenceHash)
    ).to.be.revertedWith("Anchor already exists for this batch");
  });

  it("Should allow readback of anchored hash", async function () {
    const [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BatchProvenance");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    const batchRef = "BATCH-004";
    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("evidence_v2"));
    
    await contract.recordAnchor(batchRef, evidenceHash);
    
    const readBack = await contract.getAnchor(batchRef);
    expect(readBack).to.equal(evidenceHash);
  });
});
